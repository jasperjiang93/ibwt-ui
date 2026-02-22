#!/usr/bin/env tsx
/**
 * Manually submit result on-chain for a task
 * This is needed before user can approve
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { buildSubmitResultTransaction } from "./lib/escrow";
import fs from "fs";

async function main() {
  const taskId = process.argv[2];
  if (!taskId) {
    console.error("Usage: tsx manual-submit-result.ts <taskId>");
    process.exit(1);
  }

  // Convert taskId to bytes
  const encoded = new TextEncoder().encode(taskId);
  const taskIdBytes = new Uint8Array(32);
  taskIdBytes.set(encoded.slice(0, 32));

  // Get agent wallet from environment or use default devnet wallet
  const agentKeypairPath = process.env.AGENT_KEYPAIR_PATH ||
    `${process.env.HOME}/.config/solana/id.json`;

  if (!fs.existsSync(agentKeypairPath)) {
    console.error(`❌ Agent keypair not found at: ${agentKeypairPath}`);
    console.error("Set AGENT_KEYPAIR_PATH environment variable or use default Solana CLI wallet");
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(agentKeypairPath, 'utf-8'));
  const agentKeypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
  const agentWallet = agentKeypair.publicKey;

  console.log(`\n🤖 Submitting result for task ${taskId}...`);
  console.log(`Agent wallet: ${agentWallet.toBase58()}\n`);

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Build submit_result transaction
  const tx = await buildSubmitResultTransaction({
    connection,
    agent: agentWallet,
    taskId: taskIdBytes,
  });

  // Sign and send
  tx.sign(agentKeypair);
  const signature = await connection.sendRawTransaction(tx.serialize());
  console.log(`📤 Transaction sent: ${signature}`);
  console.log(`Waiting for confirmation...`);

  await connection.confirmTransaction(signature, "confirmed");
  console.log(`✅ Result submitted on-chain!`);
  console.log(`\nView transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log(`\nNow you can approve the result in the dashboard.`);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
