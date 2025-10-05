import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toClientArray } from "@/lib/mongodb-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin (you might want to add role checking)
    const client = await clientPromise;
    const db = client.db("university");

    // Get all faculty members with basic profile info
    const facultyMembers = await db.collection("faculty")
      .find({}, {
        projection: {
          password: 0,
          resetToken: 0,
          resetTokenExpiry: 0,
          username: 0,
          facultyCode: 0
        }
      })
      .toArray();

    const clientFacultyData = toClientArray(facultyMembers);

    return NextResponse.json(clientFacultyData);
  } catch (err) {
    console.error("Faculty fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}