import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("university");
    const facultyCollection = db.collection("faculty");

    const faculty = await facultyCollection.findOne({ username });
    if (!faculty) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, faculty.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        id: faculty._id,
        username: faculty.username,
        email: faculty.email,
        facultyCode: faculty.facultyCode,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    const { password: _, ...facultyData } = faculty;

    return NextResponse.json({ token, faculty: facultyData }, { status: 200 });
  } catch (error) {
    console.error("Faculty login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
