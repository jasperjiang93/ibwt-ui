import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "jasperjiang93@gmail.com";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Store in database
    await prisma.contactMessage.create({
      data: { name, email, subject, message },
    });

    // Send notification email
    const subjectLabels: Record<string, string> = {
      general: "General Inquiry",
      partnership: "Partnership",
      agent: "Register Agent",
      mcp: "Register MCP Tool",
      bug: "Bug Report",
      other: "Other",
    };

    await sendNotificationEmail({
      to: NOTIFY_EMAIL,
      subject: `🤖 IBWT Contact: ${subjectLabels[subject] || subject}`,
      text: `
New contact form submission:

From: ${name} <${email}>
Subject: ${subjectLabels[subject] || subject}
Time: ${new Date().toISOString()}

Message:
${message}
      `.trim(),
      replyTo: email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

async function sendNotificationEmail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IBWT <noreply@inbotwetrust.com>",
        to,
        subject,
        text,
        reply_to: replyTo,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
    }
    return;
  }

  // Fallback: log to console for dev
  console.log("=== CONTACT FORM NOTIFICATION ===");
  console.log(`To: ${to}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log("=================================");
}
