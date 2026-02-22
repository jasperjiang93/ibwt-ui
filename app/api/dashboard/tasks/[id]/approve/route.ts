import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface ApproveRequest {
  approveTxId: string; // Solana transaction ID for approve escrow call
}

/**
 * POST /api/dashboard/tasks/[id]/approve
 * User approves result and releases funds to agent
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body: ApproveRequest = await req.json();
    const { approveTxId } = body;

    if (!approveTxId) {
      return NextResponse.json(
        { error: "Missing required field: approveTxId" },
        { status: 400 }
      );
    }

    // Verify task exists and has result
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { result: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "review") {
      return NextResponse.json(
        { error: "Task is not pending review" },
        { status: 400 }
      );
    }

    if (!task.result) {
      return NextResponse.json(
        { error: "No result submitted yet" },
        { status: 400 }
      );
    }

    // Update task status to completed and save approve transaction
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "done",
        approveTxId: approveTxId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error approving task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve task" },
      { status: 500 }
    );
  }
}
