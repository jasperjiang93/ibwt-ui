import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status"); // open, in_progress, completed

  const where = status ? { status } : {};

  const tasks = await prisma.task.findMany({
    where,
    include: {
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = tasks.map((task) => ({
    id: task.id,
    request: task.request,
    budgetIbwt: task.budgetIbwt,
    status: task.status,
    bidsCount: task._count.bids,
    createdAt: task.createdAt.toISOString(),
  }));

  return NextResponse.json({ tasks: result });
}
