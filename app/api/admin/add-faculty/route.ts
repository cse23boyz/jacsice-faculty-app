import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    const { fullName, email, username, facultyCode } = await req.json();

    if (!fullName || !email || !username || !facultyCode) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("university");
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

    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER!, 
      subject: "Your Faculty Account Details",
      text: `Hello ${fullName},\n\nUsername: ${username}\nPassword: ${plainPassword}`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true, message: "Faculty added and email sent ✅" }, { status: 201 });
  } catch (err: any) {
    console.error("❌ Add Faculty API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
