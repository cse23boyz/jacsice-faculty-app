import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, facultyCode } = await req.json();
    const client = await clientPromise;
    const db = client.db();

    const existing = await db.collection("faculty").findOne({ username });
    if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("faculty").insertOne({
      name,
      email,
      username,
      password: hashedPassword,
      facultyCode,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add faculty" }, { status: 500 });
  }
}
