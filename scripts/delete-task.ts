#!/usr/bin/env tsx
/**
 * Delete Task Script - Remove a task and all related data from database
 *
 * Usage: tsx scripts/delete-task.ts <taskId>
 *
 * This script deletes:
 * - Task messages
 * - Task bids
 * - Task result
 * - Task itself
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("❌ Usage: tsx scripts/delete-task.ts <taskId>");
    process.exit(1);
  }

  console.log(`\n🗑️  Deleting task ${taskId}...\n`);

  // 1. Check if task exists
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      bids: true,
      result: true,
    },
  });

  if (!task) {
    console.error("❌ Task not found");
    process.exit(1);
  }

  console.log(`📋 Task: ${task.request.substring(0, 60)}...`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Budget: ${task.budgetIbwt} $IBWT`);
  console.log(`   Bids: ${task.bids.length}`);
  console.log(`   Result: ${task.result ? 'Yes' : 'No'}`);

  // 2. Confirm deletion
  console.log(`\n⚠️  This will permanently delete the task and all related data.`);
  console.log(`   Type 'yes' to confirm: `);

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    readline.question('', (ans: string) => {
      readline.close();
      resolve(ans.trim().toLowerCase());
    });
  });

  if (answer !== 'yes') {
    console.log('❌ Deletion cancelled');
    process.exit(0);
  }

  // 3. Delete related data in correct order (respecting foreign keys)
  console.log('\n🗑️  Deleting related data...\n');

  // Delete task messages
  const messagesDeleted = await prisma.taskMessage.deleteMany({
    where: { taskId },
  });
  console.log(`   ✓ Deleted ${messagesDeleted.count} messages`);

  // Delete bids
  const bidsDeleted = await prisma.bid.deleteMany({
    where: { taskId },
  });
  console.log(`   ✓ Deleted ${bidsDeleted.count} bids`);

  // Delete result (if exists)
  if (task.result) {
    await prisma.result.delete({
      where: { taskId },
    });
    console.log(`   ✓ Deleted result`);
  }

  // Delete access keys (if any)
  const keysDeleted = await prisma.accessKey.deleteMany({
    where: { taskId },
  });
  if (keysDeleted.count > 0) {
    console.log(`   ✓ Deleted ${keysDeleted.count} access keys`);
  }

  // Delete uploaded files (if any)
  const filesDeleted = await prisma.uploadedFile.deleteMany({
    where: { taskId },
  });
  if (filesDeleted.count > 0) {
    console.log(`   ✓ Deleted ${filesDeleted.count} uploaded files`);
  }

  // 4. Delete the task itself
  await prisma.task.delete({
    where: { id: taskId },
  });
  console.log(`   ✓ Deleted task`);

  console.log(`\n✅ Task ${taskId} deleted successfully!\n`);
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
