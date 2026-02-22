#!/usr/bin/env tsx
/**
 * Simulate approve transaction to see detailed error
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { buildApproveTransaction } from "./lib/escrow";
import fs from "fs";

async function main() {
  const taskId = "cmlq2g3dn0001vuqmxwb2fl18";
  const userWallet = new PublicKey("2Fppdut2ybtpU72DtebkVekobW3uG6Z4By9g1BKLXRZp");
  const agentWallet = new PublicKey("CqG2enYhFVySUJMs6ywwz2hc9K1BeNtFuE4e1oKhUYh7");

  // Convert taskId to bytes
  const encoded = new TextEncoder().encode(taskId);
  const taskIdBytes = new Uint8Array(32);
  taskIdBytes.set(encoded.slice(0, 32));

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  console.log("\n🔄 Simulating approve transaction...\n");
  console.log("User:", userWallet.toBase58());
  console.log("Agent:", agentWallet.toBase58());
  console.log("Task ID:", taskId);
  console.log("\n" + "=".repeat(60) + "\n");

  try {
    // Build transaction
    console.log("📦 Building transaction...");
    const tx = await buildApproveTransaction({
      connection,
      user: userWallet,
      agent: agentWallet,
      taskId: taskIdBytes,
    });

    console.log("✅ Transaction built successfully");
    console.log("Instructions:", tx.instructions.length);
    tx.instructions.forEach((ix, i) => {
      console.log(`  ${i + 1}. Program: ${ix.programId.toBase58()}`);
      console.log(`     Keys: ${ix.keys.length}`);
    });

    // Get a recent blockhash for simulation
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = userWallet;

    // Simulate transaction
    console.log("\n🎭 Simulating transaction...");
    const simulation = await connection.simulateTransaction(tx);

    console.log("\n" + "=".repeat(60));
    console.log("📊 Simulation Result:");
    console.log("=".repeat(60) + "\n");

    if (simulation.value.err) {
      console.log("❌ Simulation failed!");
      console.log("\nError:", JSON.stringify(simulation.value.err, null, 2));

      if (simulation.value.logs) {
        console.log("\n📋 Transaction Logs:");
        console.log("=".repeat(60));
        simulation.value.logs.forEach((log, i) => {
          console.log(`${i + 1}. ${log}`);
        });
      }
    } else {
      console.log("✅ Simulation successful!");
      console.log("Units consumed:", simulation.value.unitsConsumed);

      if (simulation.value.logs) {
        console.log("\n📋 Transaction Logs:");
        console.log("=".repeat(60));
        simulation.value.logs.forEach((log, i) => {
          console.log(`${i + 1}. ${log}`);
        });
      }
    }

  } catch (err: any) {
    console.error("\n❌ Error:", err.message);
    if (err.logs) {
      console.log("\n📋 Error Logs:");
      err.logs.forEach((log: string, i: number) => {
        console.log(`${i + 1}. ${log}`);
      });
    }
  }
}

main().catch(console.error);
