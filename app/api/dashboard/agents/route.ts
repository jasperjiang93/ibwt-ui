import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface MCPPlanEntry {
  mcp_id: string;
  mcp_name: string;
  calls: number;
  price_per_call: number;
  subtotal: number;
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  // Find user by wallet address
  const where = wallet
    ? { owner: { walletAddress: wallet } }
    : {};

  const agents = await prisma.agent.findMany({
    where,
    include: {
      bids: {
        where: { status: "accepted" },
        include: {
          acceptedForTask: { select: { status: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = agents.map((agent) => {
    // Compute earnings from completed tasks
    const earned = agent.bids
      .filter((bid) => bid.acceptedForTask?.status === "done")
      .reduce((sum, bid) => sum + bid.total, 0);

    // Compute MCP earnings breakdown
    const mcpEarnings: Record<string, { earned: number; calls: number }> = {};
    for (const bid of agent.bids) {
      if (bid.acceptedForTask?.status !== "done") continue;
      const plan = bid.mcpPlan as MCPPlanEntry[] | null;
      if (!plan) continue;
      for (const entry of plan) {
        if (!mcpEarnings[entry.mcp_id]) mcpEarnings[entry.mcp_id] = { earned: 0, calls: 0 };
        mcpEarnings[entry.mcp_id].earned += entry.subtotal;
        mcpEarnings[entry.mcp_id].calls += entry.calls;
      }
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      walletAddress: agent.walletAddress,
      capabilities: agent.capabilities,
      supportedMcps: agent.supportedMcps,
      status: agent.status,
      rating: agent.rating,
      completedTasks: agent.completedTasks,
      earned,
    };
  });

  return NextResponse.json({ agents: result });
}
