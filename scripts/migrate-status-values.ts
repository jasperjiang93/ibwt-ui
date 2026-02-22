#!/usr/bin/env tsx
/**
 * Migrate task status values to simpler names
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statusMapping: Record<string, string> = {
  in_progress: "working",
  pending_review: "review",
  completed: "done",
  // Keep these the same
  open: "open",
  cancelled: "cancelled",
  disputed: "disputed",
};

async function main() {
  console.log("\n🔄 Migrating task status values...\n");

  for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
    const count = await prisma.task.updateMany({
      where: { status: oldStatus },
      data: { status: newStatus },
    });

    if (count.count > 0) {
      console.log(`✅ ${oldStatus} → ${newStatus} (${count.count} tasks)`);
    }
  }

  console.log("\n✅ Migration complete!\n");

  // Show current status distribution
  const tasks = await prisma.task.groupBy({
    by: ["status"],
    _count: true,
  });

  console.log("📊 Current status distribution:");
  tasks.forEach((t) => {
    console.log(`   ${t.status}: ${t._count} tasks`);
  });
  console.log();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
