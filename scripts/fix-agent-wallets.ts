#!/usr/bin/env tsx
/**
 * Fix agent wallet addresses - give each agent a unique wallet
 */

import { PrismaClient } from "@prisma/client";
import { Keypair } from "@solana/web3.js";

const prisma = new PrismaClient();

// Generate deterministic agent wallets from seed phrases
const AGENT_WALLETS = {
  ResearchBot: "AgentResearchBot1111111111111111111111111", // Placeholder
  ContentWriter: "AgentContentWriter111111111111111111111", // Placeholder
};

async function main() {
  console.log("\n🔧 Fixing agent wallet addresses...\n");

  // Generate real Solana keypairs for agents
  const researchBotKeypair = Keypair.generate();
  const contentWriterKeypair = Keypair.generate();

  console.log("Generated new agent wallets:");
  console.log("  ResearchBot:", researchBotKeypair.publicKey.toBase58());
  console.log("  ContentWriter:", contentWriterKeypair.publicKey.toBase58());

  // Update agents
  const researchBot = await prisma.agent.findFirst({
    where: { name: "ResearchBot" },
  });

  const contentWriter = await prisma.agent.findFirst({
    where: { name: "ContentWriter" },
  });

  if (researchBot) {
    await prisma.agent.update({
      where: { id: researchBot.id },
      data: { walletAddress: researchBotKeypair.publicKey.toBase58() },
    });
    console.log("\n✅ Updated ResearchBot wallet");

    // Update all bids from this agent
    const updatedBids = await prisma.bid.updateMany({
      where: { agentId: researchBot.id },
      data: { agentAddress: researchBotKeypair.publicKey.toBase58() },
    });
    console.log(`   Updated ${updatedBids.count} bids`);
  }

  if (contentWriter) {
    await prisma.agent.update({
      where: { id: contentWriter.id },
      data: { walletAddress: contentWriterKeypair.publicKey.toBase58() },
    });
    console.log("\n✅ Updated ContentWriter wallet");

    // Update all bids from this agent
    const updatedBids = await prisma.bid.updateMany({
      where: { agentId: contentWriter.id },
      data: { agentAddress: contentWriterKeypair.publicKey.toBase58() },
    });
    console.log(`   Updated ${updatedBids.count} bids`);
  }

  console.log("\n💡 Important: These are new wallets and won't have any SOL or tokens.");
  console.log("   In production, agents would fund their own wallets.");
  console.log("   For testing approve/decline, the escrow will still work because:");
  console.log("   - Approve: releases funds FROM escrow TO agent (agent doesn't pay)");
  console.log("   - Decline: releases funds FROM escrow TO user (agent doesn't pay)");
  console.log("\n✅ Agent wallets fixed! You can now approve tasks.\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
