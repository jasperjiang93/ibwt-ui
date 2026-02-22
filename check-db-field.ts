import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { id: 'cmlofz68l0001vu4hu2abyjoi' },
    select: {
      id: true,
      status: true,
      escrowTxId: true,
      lockTxId: true,
      approveTxId: true,
      acceptedBidId: true,
    }
  });
  
  console.log("\n📊 Raw Database Fields:");
  console.log(JSON.stringify(task, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
