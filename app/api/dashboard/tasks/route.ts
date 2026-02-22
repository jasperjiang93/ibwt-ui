import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MatchedAgent {
  agentId: string;
  agentName: string;
  matchScore: number;
  matchedCapabilities: string[];
  suggestedMcps: any[];
}

interface CreateTaskRequest {
  userAddress: string;
  request: string;
  budgetIbwt: number;
  requirements: {
    conversation: Message[];
    keywords: string[];
    suggestedAgents: MatchedAgent[];
  };
}

/**
 * GET /api/dashboard/tasks
 * Fetch tasks with optional filters
 */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status"); // open, in_progress, completed
  const wallet = req.nextUrl.searchParams.get("wallet");

  const where: any = {};
  if (status) where.status = status;
  if (wallet) where.userAddress = wallet;

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

/**
 * POST /api/dashboard/tasks
 * Create a new task
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateTaskRequest = await req.json();
    const { userAddress, request, budgetIbwt, requirements } = body;

    // Validate required fields
    if (!userAddress || !request || budgetIbwt == null) {
      console.log("Validation failed:", { userAddress: !!userAddress, request: !!request, budgetIbwt });
      return NextResponse.json(
        { error: "Missing required fields: userAddress, request, budgetIbwt" },
        { status: 400 }
      );
    }

    // Find or create user by wallet address
    console.log("Looking for user with wallet:", userAddress);
    let user = await prisma.user.findUnique({
      where: { walletAddress: userAddress },
    });

    if (!user) {
      console.log("User not found, creating new user...");
      user = await prisma.user.create({
        data: {
          walletAddress: userAddress,
          role: "user",
        },
      });
      console.log("User created:", user.id);
    } else {
      console.log("User found:", user.id);
    }

    if (!user || !user.id) {
      throw new Error("Failed to get or create user");
    }

    // Create task
    console.log("Creating task for user:", user.id);
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        userAddress,
        request,
        budgetIbwt,
        requirements: (requirements || {}) as any,
        status: "open",
      },
    });
    console.log("Task created:", task.id);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
