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
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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

    // Get certifications for each faculty member
    const facultyWithCertifications = await Promise.all(
      facultyMembers.map(async (faculty) => {
        const certifications = await db.collection("certifications")
          .find({ facultyId: faculty._id })
          .toArray();

        return {
          ...faculty,
          certifications: toClientArray(certifications),
          totalCertifications: certifications.length
        };
      })
    );

    const clientFacultyData = toClientArray(facultyWithCertifications);

    return NextResponse.json(clientFacultyData);
  } catch (err) {
    console.error("Faculty all fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}