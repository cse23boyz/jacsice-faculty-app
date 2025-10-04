import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId } from "@/lib/mongodb-utils";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("university");
    
    const faculty = await db.collection("faculty").findOne(
      { _id: toObjectId(payload.id) }
    );

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await db.collection("faculty").updateOne(
      { _id: toObjectId(payload.id) },
      { 
        $set: { 
          resetToken,
          resetTokenExpiry 
        } 
      }
    );

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
    
    const msg = {
      to: faculty.email,
      from: process.env.EMAIL_SENDER!,
      subject: "Password Reset Request - JACSICE Faculty Portal",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your JACSICE Faculty Portal account.</p>
        <p>Click the link below to reset your password (expires in 1 hour):</p>
        <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      message: "Password reset link sent to your email" 
    });

  } catch (err) {
    console.error("Password reset request error:", err);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}