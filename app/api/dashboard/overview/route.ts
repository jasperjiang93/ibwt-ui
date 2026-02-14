import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface MCPPlanEntry {
  mcp_id: string;
  mcp_name: string;
  calls: number;
  subtotal: number;
}

function getSince(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: // 24h
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") || "24h";
  const since = getSince(period);

  // Active tasks (global — not filtered by period)
  const activeTasks = await prisma.task.count({
    where: { status: { in: ["open", "in_progress"] } },
  });

  // Completed tasks in period
  const completedTasks = await prisma.task.count({
    where: { status: "completed", createdAt: { gte: since } },
  });

  // Earnings in period: sum of accepted bids for completed tasks created in period
  const completedBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "completed" },
    },
    select: { total: true, mcpPlan: true },
  });

  const totalEarned = completedBids.reduce((sum, b) => sum + b.total, 0);

  // Spent in period: only the first user's (alice's) tasks
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  const userSpentBids = firstUser
    ? await prisma.bid.findMany({
        where: {
          status: "accepted",
          createdAt: { gte: since },
          acceptedForTask: { status: "completed", userId: firstUser.id },
        },
        select: { total: true },
      })
    : [];
  const totalSpent = userSpentBids.reduce((sum, b) => sum + b.total, 0);

  // ---- Build unified activity feed (filtered by period) ----

  // 1. Task activities (spending)
  const recentTasks = await prisma.task.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      request: true,
      status: true,
      budgetIbwt: true,
      createdAt: true,
      acceptedBid: { select: { total: true } },
    },
  });

  const taskActivities = recentTasks.map((t) => ({
    type: "task" as const,
    label: t.request,
    status: t.status,
    amount: -(t.acceptedBid?.total ?? t.budgetIbwt),
    date: t.createdAt.toISOString(),
    href: `/dashboard/tasks/${t.id}`,
  }));

  // 2. Agent earnings (from completed bids in period)
  const agentBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "completed" },
    },
    include: {
      agent: { select: { name: true } },
      acceptedForTask: { select: { request: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const agentActivities = agentBids.map((b) => ({
    type: "agent" as const,
    label: `${b.agent.name} earned from: ${b.acceptedForTask?.request ?? "task"}`,
    status: "completed",
    amount: b.total,
    date: b.createdAt.toISOString(),
    href: `/dashboard/tasks/${b.acceptedForTask?.id}`,
  }));

  // 3. MCP earnings (extracted from bid mcpPlans)
  const mcpActivities: Array<{ type: string; label: string; status: string; amount: number; date: string; href: string }> = [];
  for (const bid of agentBids) {
    const plan = bid.mcpPlan as MCPPlanEntry[] | null;
    if (!plan) continue;
    for (const entry of plan) {
      mcpActivities.push({
        type: "mcp" as const,
        label: `${entry.mcp_name} used (${entry.calls} calls)`,
        status: "completed",
        amount: entry.subtotal,
        date: bid.createdAt.toISOString(),
        href: `/dashboard/mcps`,
      });
    }
  }

  // Merge and sort by date, take top 10
  const activities = [...taskActivities, ...agentActivities, ...mcpActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return NextResponse.json({
    period,
    stats: {
      activeTasks,
      completedTasks,
      totalSpent,
      totalEarned,
    },
    activities,
  });
}
