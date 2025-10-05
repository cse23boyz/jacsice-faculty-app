import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { toObjectId, toClientObject, toClientArray } from "@/lib/mongodb-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token || token !== "admin-authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    console.log(`Fetching faculty details for ID: ${params.id}`);

    // Get faculty profile
    const faculty = await db.collection("faculty").findOne(
      { _id: toObjectId(params.id) },
      { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
    );

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Get certifications
    const certifications = await db.collection("certifications")
      .find({ facultyId: toObjectId(params.id) })
      .sort({ date: -1 })
      .toArray();

    console.log(`Found ${certifications.length} certifications for faculty ${params.id}`);

    const facultyData = toClientObject(faculty);
    const certificationsData = toClientArray(certifications);

    return NextResponse.json({
      ...facultyData,
      certifications: certificationsData
    });
  } catch (err) {
    console.error("Faculty detail fetch error:", err);
    
    if (err instanceof Error && err.message.includes("Invalid ObjectId")) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Database connection failed",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}