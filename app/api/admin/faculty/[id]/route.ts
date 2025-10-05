import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { toObjectId } from "@/lib/mongodb-utils";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const client = await clientPromise;
    const db = client.db("university");

    const faculty = await db.collection("faculty").findOne(
      { _id: toObjectId(id) },
      { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
    );

    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: faculty });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch faculty" }, { status: 500 });
  }
}
