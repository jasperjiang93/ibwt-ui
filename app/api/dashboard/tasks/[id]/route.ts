import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/dashboard/tasks/[id]
 * Fetch a single task with all details
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: { walletAddress: true },
        },
        bids: {
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
        },
        acceptedBid: {
          include: {
            agent: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
              },
            },
          },
        },
        result: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch task" },
      { status: 500 }
    );
  }
}
