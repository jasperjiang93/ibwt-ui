import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface SubmitResultRequest {
  agentId: string;
  outputs: Array<{
    type: string;
    label: string;
    content?: string;
    url?: string;
    filename?: string;
  }>;
  mcpCallsLog?: Array<{
    mcp_id: string;
    mcp_name: string;
    called_at: string;
    success: boolean;
    duration_ms: number;
  }>;
}

/**
 * POST /api/dashboard/tasks/[id]/submit-result
 * Agent submits deliverables/results for task
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body: SubmitResultRequest = await req.json();
    const { agentId, outputs, mcpCallsLog } = body;

    if (!agentId || !outputs || outputs.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, outputs" },
        { status: 400 }
      );
    }

    // Verify task exists and is in_progress
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { acceptedBid: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "working") {
      return NextResponse.json(
        { error: "Task is not in progress" },
        { status: 400 }
      );
    }

    // Verify agent matches accepted bid
    if (task.acceptedBid?.agentId !== agentId) {
      return NextResponse.json(
        { error: "Agent does not match accepted bid" },
        { status: 403 }
      );
    }

    // Create or update result
    const result = await prisma.result.upsert({
      where: { taskId },
      update: {
        outputs: outputs as any,
        mcpCallsLog: mcpCallsLog as any,
        revisionCount: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        taskId,
        agentId,
        outputs: outputs as any,
        mcpCallsLog: mcpCallsLog as any,
      },
    });

    // Update task status to pending_review (waiting for user to approve/decline)
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "review",
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ result, task: updatedTask });
  } catch (error: any) {
    console.error("Error submitting result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit result" },
      { status: 500 }
    );
  }
}
