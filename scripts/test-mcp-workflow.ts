#!/usr/bin/env tsx
/**
 * Quick test script to demonstrate the full MCP workflow
 * This simulates creating a task and having an agent execute it
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🧪 MCP Workflow Test\n");
  console.log("This script finds an in_progress task and shows how to execute it.\n");

  // Find an in_progress task
  const task = await prisma.task.findFirst({
    where: { status: "in_progress" },
    include: {
      acceptedBid: {
        include: {
          agent: true,
        },
      },
    },
  });

  if (!task) {
    console.log("❌ No in_progress tasks found in database.");
    console.log("\n💡 To create a test task:");
    console.log("   1. Run: pnpm dev");
    console.log("   2. Visit: http://localhost:3000/dashboard/tasks");
    console.log("   3. Click '+ New Task' and create a task");
    console.log("   4. Accept a bid on the task");
    console.log("   5. Run this script again\n");
    process.exit(0);
  }

  console.log("✅ Found task ready for execution!\n");
  console.log(`📋 Task Details:`);
  console.log(`   ID: ${task.id}`);
  console.log(`   Request: ${task.request}`);
  console.log(`   Budget: ${task.budgetIbwt} $IBWT`);
  console.log(`   Status: ${task.status}`);

  if (task.acceptedBid) {
    console.log(`\n🤖 Accepted Bid:`);
    console.log(`   Agent: ${task.acceptedBid.agent.name}`);
    console.log(`   Total: ${task.acceptedBid.total} $IBWT`);
    console.log(`   ETA: ${task.acceptedBid.etaMinutes} minutes`);

    const mcpPlan = task.acceptedBid.mcpPlan as any[];
    console.log(`\n📦 MCP Plan:`);
    mcpPlan.forEach((mcp, i) => {
      console.log(`   ${i + 1}. ${mcp.mcp_name}: ${mcp.calls} calls × ${mcp.price_per_call} = ${mcp.subtotal} $IBWT`);
    });
  }

  console.log(`\n🚀 To execute this task, run:`);
  console.log(`\n   tsx scripts/agent-executor.ts ${task.id}\n`);
  console.log(`This will:`);
  console.log(`   1. Generate a markdown report`);
  console.log(`   2. Convert it to PDF using pandoc`);
  console.log(`   3. Prepare email delivery (gog)`);
  console.log(`   4. Submit results to the database`);
  console.log(`\nAfter execution, you can:`);
  console.log(`   - View the task at: http://localhost:3000/dashboard/tasks/${task.id}`);
  console.log(`   - Approve or decline the result`);
  console.log(`   - Check output files in: task-outputs/${task.id}/\n`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
