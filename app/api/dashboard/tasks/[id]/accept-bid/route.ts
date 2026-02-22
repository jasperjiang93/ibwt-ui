import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

interface AcceptBidRequest {
  bidId: string;
  escrowTxId: string;
}

/**
 * POST /api/dashboard/tasks/[id]/accept-bid
 * Accept a bid and update task status after escrow lock_funds transaction
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;
    const body: AcceptBidRequest = await req.json();
    const { bidId, escrowTxId } = body;

    if (!bidId || !escrowTxId) {
      return NextResponse.json(
        { error: "Missing required fields: bidId, escrowTxId" },
        { status: 400 }
      );
    }

    // Verify bid exists and belongs to this task
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { task: true },
    });

    if (!bid || bid.taskId !== taskId) {
      return NextResponse.json(
        { error: "Bid not found or does not belong to this task" },
        { status: 404 }
      );
    }

    if (bid.task.status !== "open") {
      return NextResponse.json(
        { error: "Task is not open" },
        { status: 400 }
      );
    }

    // Update task with accepted bid and escrow transaction
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        acceptedBidId: bidId,
        status: "working",
        escrowTxId: escrowTxId,
        reviewDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      },
    });

    // Update bid status
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "accepted" },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error accepting bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept bid" },
      { status: 500 }
    );
  }
}
