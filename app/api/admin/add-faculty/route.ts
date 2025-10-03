import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

// POST /api/admin/add-faculty
export async function POST(req: Request) {
  try {
    const { fullName, email, username, facultyCode } = await req.json();

    if (!fullName || !email || !username || !facultyCode) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    // Connect to MongoDB Atlas
    const client = await clientPromise();
    const db = client.db("university");
    const facultyCollection = db.collection("faculty");

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

    // Generate password and hash it
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

    // Setup Nodemailer with Gmail App Password
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Send email
    try {
      await transporter.sendMail({
        from: `"University Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Faculty Account Details",
        text: `Hello ${fullName},\n\nUsername: ${username}\nPassword: ${plainPassword}\n\nPlease log in and change your password immediately.`,
      });
      console.log("✅ Email sent successfully to", email);
    } catch (mailErr) {
      console.error("❌ Email failed:", mailErr);
      return NextResponse.json(
        { error: "Faculty added, but email failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Faculty added successfully and email sent 🎉" },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Internal server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
