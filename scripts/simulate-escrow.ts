#!/usr/bin/env tsx
/**
 * Simulate escrow transactions for testing approve/decline flow
 * This sets mock transaction IDs so you can test the approve UI
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("Usage: npx tsx scripts/simulate-escrow.ts <taskId>");
    process.exit(1);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { acceptedBid: true },
  });

  if (!task) {
    console.error("Task not found");
    process.exit(1);
  }

  if (!task.acceptedBid) {
    console.error("Task has no accepted bid");
    process.exit(1);
  }

  console.log(`\n🔧 Simulating escrow for task ${taskId}...`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Budget: ${task.budgetIbwt} $IBWT`);
  console.log(`   Accepted Bid Total: ${task.acceptedBid.total} $IBWT`);

  // Generate mock Solana transaction signature
  const mockTxId = "5" + "x".repeat(87); // Solana tx signatures are 88 chars

  if (task.status === "open") {
    // Simulate lock_funds
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "in_progress",
        escrowTxId: mockTxId,
      },
    });
    console.log(`\n   ✅ Simulated lock_funds transaction`);
    console.log(`   📝 Status: open → in_progress`);
    console.log(`   💰 ${task.acceptedBid.total} $IBWT locked in escrow (simulated)`);
    console.log(`\n💡 Next: Run agent executor to generate result`);
    console.log(`   npx tsx scripts/agent-executor.ts ${taskId}\n`);
  } else if (task.status === "in_progress") {
    // Task is in progress, remind to run executor
    console.log(`\n   ℹ️  Task already in progress`);
    console.log(`   💡 Run agent executor to generate result:`);
    console.log(`   npx tsx scripts/agent-executor.ts ${taskId}\n`);
  } else if (task.status === "pending_review") {
    // Task already has result, set mock escrowTxId if missing
    if (!task.escrowTxId) {
      await prisma.task.update({
        where: { id: taskId },
        data: { escrowTxId: mockTxId },
      });
      console.log(`\n   ✅ Added mock escrow transaction ID`);
    }
    console.log(`\n   ✅ Task ready for review`);
    console.log(`   💡 Visit: http://localhost:3000/dashboard/tasks/${taskId}`);
    console.log(`   💡 Click "Approve & Release Funds" to test escrow release\n`);
  } else {
    console.log(`\n   ℹ️  Task status: ${task.status}`);
    console.log(`   Nothing to simulate\n`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
