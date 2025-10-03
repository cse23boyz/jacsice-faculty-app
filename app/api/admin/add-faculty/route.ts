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

    console.log("Connecting to MongoDB Atlas...");
    const client = await clientPromise;
    const db = client.db("university");
    const facultyCollection = db.collection("faculty");
    console.log("✅ Connected to MongoDB Atlas");

    // Check if username or facultyCode exists
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

    const newFaculty = {
      fullName,
      email,
      username,
      facultyCode,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await facultyCollection.insertOne(newFaculty);
    console.log("✅ Faculty added to MongoDB:", username);

    // Setup Nodemailer (use port 587 for cloud-friendly TLS)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    let emailResult = { sent: false, error: null };

    // Send email in try/catch so it doesn't block API
    try {
      await transporter.sendMail({
        from: `"University Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Faculty Account Details",
        text: `Hello ${fullName},\nUsername: ${username}\nPassword: ${plainPassword}\n\nPlease log in and change your password immediately.`,
      });
      emailResult.sent = true;
      console.log("✅ Email sent successfully to", email);
    } catch (err: any) {
      emailResult.error = err.message;
      console.error("❌ Email failed:", err);
    }

    // Always return JSON to frontend
    return NextResponse.json(
      {
        message: "Faculty added successfully",
        emailResult,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Internal server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
