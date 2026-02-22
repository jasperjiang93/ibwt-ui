#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const taskId = process.argv[2];

  if (!taskId) {
    console.error("Usage: tsx scripts/reset-to-working.ts <taskId>");
    process.exit(1);
  }

  console.log(`🔄 Resetting task ${taskId} to working status...`);

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    console.error("❌ Task not found");
    process.exit(1);
  }

  console.log(`   Current status: ${task.status}`);

  // Reset to working and clear result
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "working",
    },
  });

  // Delete existing result if any
  await prisma.result.deleteMany({
    where: { taskId: taskId },
  });

  console.log("✅ Task reset to working status");
  console.log("✅ Existing results deleted");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
