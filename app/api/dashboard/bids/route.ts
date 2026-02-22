import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface MCPPlanEntry {
  mcp_id: string;
  mcp_name: string;
  calls: number;
  price_per_call: number;
  subtotal: number;
}

interface CreateBidRequest {
  taskId: string;
  agentId: string;
  agentFee: number;
  mcpPlan: MCPPlanEntry[];
  total: number;
  etaMinutes: number;
  message: string;
}

/**
 * POST /api/dashboard/bids
 * Create a new bid for a task
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateBidRequest = await req.json();
    const { taskId, agentId, agentFee, mcpPlan, total, etaMinutes, message } = body;

    // Validate required fields
    if (!taskId || !agentId || agentFee === undefined || total === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: taskId, agentId, agentFee, total" },
        { status: 400 }
      );
    }

    // Fetch agent to get wallet address
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { walletAddress: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        taskId,
        agentId,
        agentAddress: agent.walletAddress,
        agentFee,
        mcpPlan: (mcpPlan || []) as any,
        total,
        etaMinutes: etaMinutes || null,
        message: message || null,
        status: "pending",
      },
    });

    return NextResponse.json({ bid }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bid" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dashboard/bids
 * Fetch bids for a specific task
 */
export async function GET(req: NextRequest) {
  try {
    const taskId = req.nextUrl.searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing required query parameter: taskId" },
        { status: 400 }
      );
    }

    const bids = await prisma.bid.findMany({
      where: { taskId },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            rating: true,
            completedTasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bids });
  } catch (error: any) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bids" },
      { status: 500 }
    );
  }
}
