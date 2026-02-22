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
  const wallet = req.nextUrl.searchParams.get("wallet");
  const since = getSince(period);

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  // Global stats (not filtered by period)
  const activeTasks = await prisma.task.count({
    where: {
      userAddress: wallet,
      status: { in: ["open", "working"] }
    },
  });

  const totalTasksCompleted = await prisma.task.count({
    where: {
      userAddress: wallet,
      status: "done"
    },
  });

  const totalAgents = await prisma.agent.count({
    where: { owner: { walletAddress: wallet } }
  });

  const totalMCPs = await prisma.mcp.count({
    where: { providerAddress: wallet }
  });

  // Completed tasks in period
  const completedTasks = await prisma.task.count({
    where: {
      userAddress: wallet,
      status: "done",
      createdAt: { gte: since }
    },
  });

  // Spent in period: tasks created by this wallet
  const userSpentBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: {
        status: "done",
        userAddress: wallet
      },
    },
    select: { total: true },
  });
  const totalSpent = userSpentBids.reduce((sum, b) => sum + b.total, 0);

  // Earnings in period: from agents and MCPs owned by this wallet
  // 1. Agent earnings
  const agentEarnings = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "done" },
      agent: { owner: { walletAddress: wallet } },
    },
    select: { agentFee: true },
  });
  const totalAgentEarned = agentEarnings.reduce((sum, b) => sum + (b.agentFee || 0), 0);

  // 2. MCP earnings
  const mcpEarnings = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "done" },
    },
    select: { mcpPlan: true },
  });

  let totalMcpEarned = 0;
  for (const bid of mcpEarnings) {
    const plan = bid.mcpPlan as MCPPlanEntry[] | null;
    if (!plan) continue;
    for (const entry of plan) {
      // Check if this MCP belongs to the wallet
      const mcp = await prisma.mcp.findFirst({
        where: { id: entry.mcp_id, providerAddress: wallet }
      });
      if (mcp) {
        totalMcpEarned += entry.subtotal;
      }
    }
  }

  const totalEarned = totalAgentEarned + totalMcpEarned;

  // ---- Build unified activity feed (filtered by period and wallet) ----

  // 1. Task activities (spending by this wallet)
  const recentTasks = await prisma.task.findMany({
    where: {
      userAddress: wallet,
      createdAt: { gte: since }
    },
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

  // 2. Agent earnings (from this wallet's agents)
  const agentBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "done" },
      agent: { owner: { walletAddress: wallet } },
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
    status: "done",
    amount: b.agentFee || 0,
    date: b.createdAt.toISOString(),
    href: `/dashboard/tasks/${b.acceptedForTask?.id}`,
  }));

  // 3. MCP earnings (from this wallet's MCPs)
  const allCompletedBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      createdAt: { gte: since },
      acceptedForTask: { status: "done" },
    },
    select: { mcpPlan: true, createdAt: true },
  });

  const userMcps = await prisma.mcp.findMany({
    where: { providerAddress: wallet },
    select: { id: true, name: true }
  });
  const userMcpIds = new Set(userMcps.map(m => m.id));
  const mcpNameMap = new Map(userMcps.map(m => [m.id, m.name]));

  const mcpActivities: Array<{ type: string; label: string; status: string; amount: number; date: string; href: string }> = [];
  for (const bid of allCompletedBids) {
    const plan = bid.mcpPlan as MCPPlanEntry[] | null;
    if (!plan) continue;
    for (const entry of plan) {
      if (userMcpIds.has(entry.mcp_id)) {
        mcpActivities.push({
          type: "mcp" as const,
          label: `${mcpNameMap.get(entry.mcp_id) || entry.mcp_name} used (${entry.calls} calls)`,
          status: "done",
          amount: entry.subtotal,
          date: bid.createdAt.toISOString(),
          href: `/dashboard/mcps`,
        });
      }
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
      totalTasksCompleted,
      totalAgents,
      totalMCPs,
      completedTasks,
      totalSpent,
      totalEarned,
    },
    activities,
  });
}
