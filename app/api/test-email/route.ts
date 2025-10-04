import { NextResponse } from "next/server";
import { getGmailTransporter } from "@/lib/mailer";

export async function GET() {
  try {
    const transporter = await getGmailTransporter();

    const info = await transporter.sendMail({
      from: `"Admin Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send test mail to yourself
      subject: "✅ Gmail Test Email",
      text: "This is a test email sent from your Render deployment using Gmail + App Password.",
    });

    console.log("📩 Test email sent:", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
