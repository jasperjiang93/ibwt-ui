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
  deadline,
}: {
  connection: Connection;
  user: PublicKey;
  agent: PublicKey;
  taskId: Uint8Array; // 32 bytes
  amount: number;
  deadline: number; // unix timestamp
}): Promise<Transaction> {
  const [escrowPda] = deriveEscrowPda(taskId);
  const userAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, user);
  const escrowAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, escrowPda, true);
  const program = getProgram(connection, user);

  // Check if escrow ATA exists; if not, we need to create it
  const escrowAtaInfo = await connection.getAccountInfo(escrowAta);

  const tx = new Transaction();

  if (!escrowAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(user, escrowAta, escrowPda, IBWT_TOKEN_MINT)
    );
  }

  const lockIx = await program.methods
    .lockFunds(Array.from(taskId), new BN(amount), new BN(deadline))
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

function getProgram(connection: Connection, user: PublicKey) {
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: user,
      signTransaction: async <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(tx: T) => tx,
      signAllTransactions: async <T extends import("@solana/web3.js").Transaction | import("@solana/web3.js").VersionedTransaction>(txs: T[]) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program(idl as never, provider);
}

function deriveEscrowPda(taskId: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(taskId)],
    ESCROW_PROGRAM_ID
  );
}

/**
 * Build a submit_result transaction (agent submits, starts 48h review).
 */
export async function buildSubmitResultTransaction({
  connection,
  agent,
  taskId,
}: {
  connection: Connection;
  agent: PublicKey;
  taskId: Uint8Array;
}): Promise<Transaction> {
  const [escrowPda] = deriveEscrowPda(taskId);
  const program = getProgram(connection, agent);

  const ix = await program.methods
    .submitResult()
    .accounts({
      agent,
      escrow: escrowPda,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = agent;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}

/**
 * Build an approve transaction (user approves, 100% to agent).
 */
export async function buildApproveTransaction({
  connection,
  user,
  agent,
  taskId,
}: {
  connection: Connection;
  user: PublicKey;
  agent: PublicKey;
  taskId: Uint8Array;
}): Promise<Transaction> {
  const [escrowPda] = deriveEscrowPda(taskId);
  const escrowAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, escrowPda, true);
  const agentAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, agent);
  const program = getProgram(connection, user);

  const ix = await program.methods
    .approve()
    .accounts({
      user,
      escrow: escrowPda,
      escrowTokenAccount: escrowAta,
      agentTokenAccount: agentAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(ix);
  tx.feePayer = user;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  return tx;
}

/**
 * Build a decline transaction (user declines, 100% refund to user).
 */
export async function buildDeclineTransaction({
  connection,
  user,
  taskId,
}: {
  connection: Connection;
  user: PublicKey;
  taskId: Uint8Array;
}): Promise<Transaction> {
  const [escrowPda] = deriveEscrowPda(taskId);
  const escrowAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, escrowPda, true);
  const userAta = getAssociatedTokenAddressSync(IBWT_TOKEN_MINT, user);
  const program = getProgram(connection, user);

  const ix = await program.methods
    .decline()
    .accounts({
      user,
      escrow: escrowPda,
      escrowTokenAccount: escrowAta,
      userTokenAccount: userAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();

  const tx = new Transaction().add(ix);
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
