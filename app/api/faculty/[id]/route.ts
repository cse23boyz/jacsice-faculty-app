import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    const faculty = await db.collection("faculty").findOne({ _id: new (require("mongodb").ObjectId)(params.id) });
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    return NextResponse.json({
      id: faculty._id.toString(),
      name: faculty.name,
      email: faculty.email,
      username: faculty.username,
      facultyCode: faculty.facultyCode,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
