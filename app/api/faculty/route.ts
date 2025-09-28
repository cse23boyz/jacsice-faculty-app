import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/university";

if (!mongoose.connection.readyState) {
  mongoose.connect(MONGO_URI, { dbName: "university" });
}

const facultySchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  facultyCode: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
});

const Faculty =
  mongoose.models.Faculty || mongoose.model("Faculty", facultySchema);

function generatePassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

async function sendEmail(to: string, username: string, password: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"University Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Faculty Account",
    html: `
      <h2>Welcome to University Portal</h2>
      <p>Username: ${username}</p>
      <p>Password: ${password}</p>
    `,
  });
}

export async function POST(req: Request) {
  try {
    const { name, email, facultyCode, username } = await req.json();
    const plainPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newFaculty = new Faculty({ name, email, facultyCode, username, password: hashedPassword });
    await newFaculty.save();

    await sendEmail(email, username, plainPassword);

    return NextResponse.json({ success: true, message: "Faculty added and email sent!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
