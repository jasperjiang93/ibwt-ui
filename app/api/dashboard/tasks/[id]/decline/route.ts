import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface DeclineRequest {
  declineTxId: string; // Solana transaction ID for decline escrow call
  reason?: string;
}

/**
 * POST /api/dashboard/tasks/[id]/decline
 * User declines result and gets refund
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body: DeclineRequest = await req.json();
    const { declineTxId, reason } = body;

    if (!declineTxId) {
      return NextResponse.json(
        { error: "Missing required field: declineTxId" },
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

    // Update task status to cancelled and save decline transaction
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "cancelled",
        declineTxId: declineTxId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error declining task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to decline task" },
      { status: 500 }
    );
  }
}
