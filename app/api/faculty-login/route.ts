import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("");

    const faculty = await db.collection("faculty").findOne({ username });
    if (!faculty) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, faculty.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: faculty._id.toString(), username: faculty.username },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      faculty: {
        id: faculty._id.toString(),
        name: faculty.name,
        email: faculty.email,
        username: faculty.username,
        facultyCode: faculty.facultyCode, 
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
