import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { toClientArray } from "@/lib/mongodb-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token || token !== "admin-authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    console.log("Fetching faculty data from MongoDB Atlas...");

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
      .sort({ fullName: 1 }) // Sort by name
      .toArray();

    console.log(`Found ${facultyMembers.length} faculty members`);

    // Get certifications for each faculty member
    const facultyWithCertifications = await Promise.all(
      facultyMembers.map(async (faculty) => {
        try {
          const certifications = await db.collection("certifications")
            .find({ facultyId: faculty._id })
            .sort({ date: -1 }) // Sort by date descending
            .toArray();

          return {
            ...faculty,
            certifications: toClientArray(certifications)
          };
        } catch (certError) {
          console.error(`Error fetching certifications for faculty ${faculty._id}:`, certError);
          return {
            ...faculty,
            certifications: []
          };
        }
      })
    );

    const clientFacultyData = toClientArray(facultyWithCertifications);

    return NextResponse.json(clientFacultyData);
  } catch (err) {
    console.error("Faculty all fetch error:", err);
    return NextResponse.json({ 
      error: "Database connection failed",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}