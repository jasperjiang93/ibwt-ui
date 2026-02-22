import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { id: 'cmlofz68l0001vu4hu2abyjoi' },
    include: {
      user: true,
      acceptedBid: {
        include: {
          agent: true,
        },
      },
      result: true,
    },
  });

  console.log("\n📋 Task Full Details:\n");
  console.log("Task ID:", task?.id);
  console.log("Status:", task?.status);
  console.log("User Address:", task?.userAddress);
  console.log("\nAccepted Bid:");
  console.log("  Agent:", task?.acceptedBid?.agent.name);
  console.log("  Agent Wallet:", task?.acceptedBid?.agent.walletAddress);
  console.log("  Agent Address:", task?.acceptedBid?.agentAddress);
  console.log("  Total:", task?.acceptedBid?.total);
  console.log("  Bid ID:", task?.acceptedBid?.id);
  console.log("\nLock Transaction:", task?.lockTxId || "NOT SET");
  console.log("Approve Transaction:", task?.approveTxId || "NOT SET");
  
  if (task?.result) {
    console.log("\nResult:");
    console.log("  Submitted:", task.result.submittedAt || task.result.createdAt);
    console.log("  Outputs count:", (task.result.outputs as any[])?.length || 0);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
