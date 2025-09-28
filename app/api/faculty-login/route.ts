import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const client = await clientPromise;
    const db = client.db();

    const faculty = await db.collection("faculty").findOne({ username });
    if (!faculty) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, faculty.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign({ id: faculty._id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return NextResponse.json({ token, faculty: { id: faculty._id, name: faculty.name, email: faculty.email, facultyCode: faculty.facultyCode } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
