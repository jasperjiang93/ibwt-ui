#!/usr/bin/env tsx
/**
 * Debug escrow account state
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { ESCROW_PROGRAM_ID } from "./lib/solana";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "./lib/idl/escrow.json";

async function main() {
  const taskId = process.argv[2] || "cmlq2g3dn0001vuqmxwb2fl18";

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Convert taskId to bytes
  const encoded = new TextEncoder().encode(taskId);
  const taskIdBytes = new Uint8Array(32);
  taskIdBytes.set(encoded.slice(0, 32));

  // Derive escrow PDA
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(taskIdBytes)],
    ESCROW_PROGRAM_ID
  );

  console.log("\n📊 Escrow Account Debug\n");
  console.log("Task ID:", taskId);
  console.log("Escrow PDA:", escrowPda.toBase58());
  console.log("Task ID (hex):", Buffer.from(taskIdBytes).toString("hex"));
  console.log("\n" + "=".repeat(60) + "\n");

  const account = await connection.getAccountInfo(escrowPda);
  if (!account) {
    console.log("❌ Escrow account not found!");
    process.exit(1);
  }

  console.log("✅ Escrow account exists");
  console.log("Owner:", account.owner.toBase58());
  console.log("Lamports:", account.lamports);
  console.log("Data length:", account.data.length);

  // Try to decode escrow state using Anchor
  try {
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: async (tx: any) => tx,
      signAllTransactions: async (txs: any) => txs,
    };

    const provider = new AnchorProvider(
      connection,
      dummyWallet as any,
      { commitment: "confirmed" }
    );

    const program = new Program(idl as any, provider);
    const escrowData = await program.account.escrow.fetch(escrowPda);

    console.log("\n" + "=".repeat(60));
    console.log("📋 Escrow State:");
    console.log("=".repeat(60) + "\n");

    console.log("Task ID:", Buffer.from(escrowData.taskId as any).toString("hex"));
    console.log("User:", (escrowData.user as PublicKey).toBase58());
    console.log("Agent:", (escrowData.agent as PublicKey).toBase58());
    console.log("Mint:", (escrowData.mint as PublicKey).toBase58());
    console.log("Amount:", escrowData.amount.toString());
    console.log("Deadline:", new Date(escrowData.deadline.toNumber() * 1000).toISOString());
    console.log("Review Deadline:", new Date(escrowData.reviewDeadline.toNumber() * 1000).toISOString());
    console.log("Status:", escrowData.status);
    console.log("Created At:", new Date(escrowData.createdAt.toNumber() * 1000).toISOString());
    console.log("Bump:", escrowData.bump);

    console.log("\n" + "=".repeat(60));
    console.log("🔍 Check Results:");
    console.log("=".repeat(60) + "\n");

    // Check if status is correct
    const statusKey = Object.keys(escrowData.status)[0];
    console.log(`Status: ${statusKey}`);

    if (statusKey === "locked") {
      console.log("✅ Status is 'Locked' - ready for approve");
    } else if (statusKey === "pendingReview") {
      console.log("⚠️  Status is 'PendingReview' - but new program should accept Locked");
    } else {
      console.log(`❌ Status is '${statusKey}' - cannot approve`);
    }

  } catch (err: any) {
    console.error("\n❌ Failed to decode escrow state:", err.message);
    console.log("\nRaw data (first 200 bytes):");
    console.log(account.data.slice(0, 200).toString("hex"));
  }
}

main().catch(console.error);
