import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // Gmail app password
      },
    });

    // Send test mail
    await transporter.sendMail({
      from: `"Test App" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: "✅ Test Email from Render",
      text: "Hello! This is a test email from your Next.js app on Render.",
    });

    return NextResponse.json({ success: true, message: "Test email sent ✅" });
  } catch (err: any) {
    console.error("❌ Email Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
