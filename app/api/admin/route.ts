import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, facultyCode } = await req.json();
    if (!name || !email || !username || !password || !facultyCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("");

    const existing = await db.collection("faculty").findOne({ username , facultyCode });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newFaculty = {
      name,
      email,
      username,
      password: hashedPassword,
      facultyCode,
      createdAt: new Date(),
    };

    await db.collection("faculty").insertOne(newFaculty);

    return NextResponse.json({ message: "Faculty added successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add faculty" }, { status: 500 });
  }
}
