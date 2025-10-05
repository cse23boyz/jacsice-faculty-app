import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId, toClientArray } from "@/lib/mongodb-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    // Get certifications for the specific faculty member
    const certifications = await db.collection("certifications")
      .find({ facultyId: toObjectId(params.id) })
      .sort({ date: -1 })
      .toArray();

    const certificationsData = toClientArray(certifications);

    return NextResponse.json(certificationsData);
  } catch (err) {
    console.error("Faculty certifications fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}