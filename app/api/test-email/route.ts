import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
      logger: true,
      debug: true,
    });

    const info = await transporter.sendMail({
      from: `"Test Admin" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,  // send to yourself first
      subject: "Render Test Email",
      text: "If you see this, Gmail App Password is working ✅",
    });

    console.log("Email sent:", info);
    return NextResponse.json({ success: true, info });
  } catch (error) {
    console.error("❌ Email test failed:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
