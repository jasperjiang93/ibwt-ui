import { NextResponse } from "next/server";

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    // Send notification email
    await sendNotificationEmail({
      to: NOTIFY_EMAIL!,
      subject: "🤖 New IBWT Waitlist Signup",
      text: `New waitlist signup:\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });

    // TODO: Also store in database
    // await prisma.waitlist.create({ data: { email } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}

async function sendNotificationEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  // Option 1: Use Resend (recommended)
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
      }),
    });
    
    if (!res.ok) {
      console.error("Resend error:", await res.text());
    }
    return;
  }

  // Option 2: Use SMTP (nodemailer) - for local dev just log
  console.log("=== WAITLIST NOTIFICATION ===");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log("=============================");
}
