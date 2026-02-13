import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { ESCROW_PROGRAM_ID, IBWT_TOKEN_MINT } from "./solana";
import idl from "./idl/escrow.json";

/**
 * Build a lock_funds transaction for the escrow program.
 * Returns a Transaction ready for wallet signing.
 */
export async function buildLockFundsTransaction({
  connection,
  user,
  agent,
  taskId,
  amount,
}: {
  connection: Connection;
  user: PublicKey;
  agent: PublicKey;
  taskId: Uint8Array; // 32 bytes
  amount: number;
}): Promise<Transaction> {
  // Derive escrow PDA
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(taskId)],
    ESCROW_PROGRAM_ID
  );

  // Token accounts
  const userAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, user);
  const escrowAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, escrowPda, true);

  // Build a dummy provider (we only need it for Program construction, not signing)
  const provider = new AnchorProvider(
    connection,
    // Minimal wallet interface — we only build the tx, signing happens in the component
    {
      publicKey: user,
      signTransaction: async <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(tx: T) => tx,
      signAllTransactions: async <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(txs: T[]) => txs,
    },
    { commitment: "confirmed" }
  );

  const program = new Program(idl as never, provider);

  // Check if escrow ATA exists; if not, we need to create it
  const escrowAtaInfo = await connection.getAccountInfo(escrowAta);

  const tx = new Transaction();

  if (!escrowAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(user, escrowAta, escrowPda, IBWT_TOKEN_MINT)
    );
  }

  const lockIx = await program.methods
    .lockFunds(Array.from(taskId), new BN(amount))
    .accounts({
      user,
      agent,
      escrow: escrowPda,
      mint: IBWT_TOKEN_MINT,
      userTokenAccount: userAta,
      escrowTokenAccount: escrowAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  tx.add(lockIx);

  tx.feePayer = user;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

/** Generate a random 32-byte task ID */
export function generateTaskId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/** Format a 32-byte task ID as hex string */
export function taskIdToHex(taskId: Uint8Array): string {
  return Array.from(taskId)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
