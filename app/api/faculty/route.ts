import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/university";

// Connect to MongoDB once
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

// Helper: Generate random password
function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// Email sender
async function sendEmail(to: string, username: string, password: string) {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use Outlook, Yahoo, etc.
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // App password (NOT your Gmail login password)
    },
  });

  // Email content
  const mailOptions = {
    from: `"University Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Faculty Account Access",
    html: `
      <h2>Welcome to University Portal 🎓</h2>
      <p>Hello <b>${username}</b>,</p>
      <p>Your faculty account has been created. Here are your login details:</p>
      <ul>
        <li><b>Username:</b> ${username}</li>
        <li><b>Password:</b> ${password}</li>
      </ul>
      <p>👉 Please log in and change your password immediately for security.</p>
      <br/>
      <p>Best Regards,<br/>University Admin</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Generate & hash password
    const plainPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Save to DB
    const newFaculty = new Faculty({
      ...body,
      password: hashedPassword,
    });

    await newFaculty.save();

    // Send email
    await sendEmail(body.email, body.username, plainPassword);

    return NextResponse.json({
      message: "Faculty added successfully & email sent 📧",
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Error adding faculty", error: error.message },
      { status: 500 }
    );
  }
}
