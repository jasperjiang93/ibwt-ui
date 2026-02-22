import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // 找到最新创建的任务
  const task = await prisma.task.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      acceptedBid: {
        include: {
          agent: true,
        },
      },
      result: true,
    },
  });

  if (!task) {
    console.log("No tasks found");
    return;
  }

  console.log("\n📋 Latest Task:");
  console.log(`   ID: ${task.id}`);
  console.log(`   Request: ${task.request}`);
  console.log(`   Status: ${task.status}`);
  console.log(`   Budget: ${task.budgetIbwt} $IBWT`);
  console.log(`   Created: ${task.createdAt}`);

  if (task.acceptedBid) {
    console.log(`\n🤖 Accepted Bid:`);
    console.log(`   Agent: ${task.acceptedBid.agent.name}`);
    console.log(`   Total: ${task.acceptedBid.total} $IBWT`);
    
    const mcpPlan = task.acceptedBid.mcpPlan as any[];
    console.log(`\n📦 MCP Plan:`);
    mcpPlan.forEach((mcp, i) => {
      console.log(`   ${i + 1}. ${mcp.mcp_name}: ${mcp.calls} calls`);
    });
  }

  if (task.result) {
    console.log(`\n✅ Result exists:`);
    console.log(`   Submitted: ${task.result.submittedAt || task.result.createdAt}`);
    console.log(`   Outputs:`, JSON.stringify(task.result.outputs, null, 2));
  }

  console.log(`\n🚀 Next steps:`);
  if (task.status === 'open') {
    console.log(`   - Accept a bid to start the task`);
  } else if (task.status === 'in_progress') {
    console.log(`   - Run: npx tsx scripts/agent-executor.ts ${task.id}`);
  } else if (task.status === 'pending_review') {
    console.log(`   - Visit: http://localhost:3000/dashboard/tasks/${task.id}`);
    console.log(`   - Approve or decline the result`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
