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

  const where = wallet ? { providerAddress: wallet } : {};

  const mcps = await prisma.mcp.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Get all accepted bids for completed tasks to compute MCP earnings
  const completedBids = await prisma.bid.findMany({
    where: {
      status: "accepted",
      acceptedForTask: { status: "completed" },
    },
    select: { mcpPlan: true },
  });

  // Aggregate earnings per MCP
  const mcpStats: Record<string, { earned: number; totalCalls: number }> = {};
  for (const bid of completedBids) {
    const plan = bid.mcpPlan as MCPPlanEntry[] | null;
    if (!plan) continue;
    for (const entry of plan) {
      if (!mcpStats[entry.mcp_id]) mcpStats[entry.mcp_id] = { earned: 0, totalCalls: 0 };
      mcpStats[entry.mcp_id].earned += entry.subtotal;
      mcpStats[entry.mcp_id].totalCalls += entry.calls;
    }
  }

  const result = mcps.map((mcp) => ({
    id: mcp.id,
    name: mcp.name,
    description: mcp.description,
    providerAddress: mcp.providerAddress,
    endpoint: mcp.endpoint,
    pricePerCall: mcp.pricePerCall,
    status: mcp.status,
    earned: mcpStats[mcp.id]?.earned || 0,
    totalCalls: mcpStats[mcp.id]?.totalCalls || 0,
  }));

  return NextResponse.json({ mcps: result });
}
