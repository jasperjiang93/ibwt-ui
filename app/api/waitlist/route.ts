import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["user", "agent_provider", "mcp_provider", "other"];

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const validRole = VALID_ROLES.includes(role) ? role : "user";

    await prisma.waitlistEntry.upsert({
      where: { email },
      create: { email, role: validRole },
      update: { role: validRole },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
