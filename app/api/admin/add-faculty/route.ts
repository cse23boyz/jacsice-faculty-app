import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

// MongoDB client singleton
let client: MongoClient;

async function getClient() {
  if (!client) {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client;
}

export async function POST(req: Request) {
  try {
    const { fullName, email, username, facultyCode } = await req.json();

    if (!fullName || !email || !username || !facultyCode) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    // Connect to MongoDB Atlas
    const client = await getClient();
    const db = client.db(process.env.DB_NAME || "university");
    const facultyCollection = db.collection("faculty");

    // Check for existing username or facultyCode
    const existing = await facultyCollection.findOne({
      $or: [{ username }, { facultyCode }],
    });
    if (existing) {
      return NextResponse.json(
        { error: "Username or Faculty Code already exists" },
        { status: 400 }
      );
    }

    // Generate random password
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

    // Insert into DB
    await facultyCollection.insertOne(newFaculty);

    // Respond immediately
    const response = NextResponse.json(
      { message: "Faculty added successfully. Email will be sent shortly." },
      { status: 201 }
    );

    // Send email in background using Mailjet
    (async () => {
      try {
        if (!process.env.MAILJET_USER || !process.env.MAILJET_PASS || !process.env.MAILJET_VERIFIED_SENDER) {
          console.error("Mailjet credentials or verified sender not set");
          return;
        }

        const transporter = nodemailer.createTransport({
          host: "in-v3.mailjet.com",
          port: 587,
          auth: {
            user: process.env.MAILJET_USER,
            pass: process.env.MAILJET_PASS,
          },
        });

        await transporter.sendMail({
          from: `"University Admin" <${process.env.MAILJET_VERIFIED_SENDER}>`,
          to: email,
          subject: "Your Faculty Account Details",
          text: `Hello ${fullName},

Your account has been created.

Username: ${username}
Password: ${plainPassword}

Please log in and change your password immediately.
`,
        });

        console.log("✅ Email sent successfully via Mailjet to", email);
      } catch (err) {
        console.error("❌ Email failed:", err);
      }
    })();

    return response;
  } catch (err) {
    console.error("❌ Internal server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
