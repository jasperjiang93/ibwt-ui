import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { id: 'cmlofz68l0001vu4hu2abyjoi' },
  });
  
  console.log("\n📊 Escrow Transaction Info:");
  console.log("Task ID:", task?.id);
  console.log("Status:", task?.status);
  console.log("escrowTxId:", task?.escrowTxId || "NULL");
  console.log("Accepted Bid ID:", task?.acceptedBidId || "NULL");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
