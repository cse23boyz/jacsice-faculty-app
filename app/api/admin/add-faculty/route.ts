import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { fullName, email, username, facultyCode } = await req.json();

    if (!fullName || !email || !username || !facultyCode) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || "university");
    const facultyCollection = db.collection("faculty");

    const existing = await facultyCollection.findOne({
      $or: [{ username }, { facultyCode }],
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or Faculty Code already exists" },
        { status: 400 }
      );
    }

    // Generate password
    const plainPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Insert new faculty
    await facultyCollection.insertOne({
      fullName,
      email,
      username,
      facultyCode,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // ✅ Gmail with App Password
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
        logger: true,     // logs SMTP communication
        debug: true  
    });

    // Send email
    await transporter.sendMail({
      from: `"University Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Faculty Account Details",
      text: `Hello ${fullName},\n\nYour faculty account has been created.\n\nUsername: ${username}\nPassword: ${plainPassword}\n\nPlease login and change your password.`,
    });

    return NextResponse.json({ message: "Faculty added and email sent ✅" }, { status: 201 });
  } catch (err) {
    console.error("❌ Email/API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
