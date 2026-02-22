#!/usr/bin/env tsx
/**
 * Reset a task to 'open' status so user can re-accept bid
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("Usage: npx tsx scripts/reset-task-status.ts <taskId>");
    process.exit(1);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    console.error("Task not found");
    process.exit(1);
  }

  console.log(`\n🔄 Resetting task ${taskId}...`);
  console.log(`   Current status: ${task.status}`);

  // Reset task to open status
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "open",
      acceptedBidId: null,
      escrowTxId: null,
      lockTxId: null,
      approveTxId: null,
      declineTxId: null,
    },
  });

  // Reset all bids to pending
  await prisma.bid.updateMany({
    where: { taskId },
    data: { status: "pending" },
  });

  // Delete result if exists
  await prisma.result.deleteMany({
    where: { taskId },
  });

  console.log(`   ✅ Task reset to 'open' status`);
  console.log(`   ✅ All bids reset to 'pending'`);
  console.log(`   ✅ Results deleted`);
  console.log(`\n💡 You can now accept a bid again\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
