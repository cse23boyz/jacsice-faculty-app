import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId, toClientObject } from "@/lib/mongodb-utils";

// GET method (existing)
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
    
    const faculty = await db.collection("faculty").findOne(
      { _id: toObjectId(payload.id) },
      { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
    );

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const facultyData = toClientObject(faculty);
    return NextResponse.json(facultyData);
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT method for updating profile
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("university");

    // Update profile in MongoDB
    const result = await db.collection("faculty").updateOne(
      { _id: toObjectId(payload.id) },
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        }
      },
      { upsert: true } // Create if doesn't exist
    );

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
    }

    // Fetch the updated profile
    const updatedFaculty = await db.collection("faculty").findOne(
      { _id: toObjectId(payload.id) },
      { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
    );

    if (!updatedFaculty) {
      return NextResponse.json({ error: "Profile not found after update" }, { status: 404 });
    }

    const facultyData = toClientObject(updatedFaculty);

    return NextResponse.json({ 
      success: true, 
      profile: facultyData 
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}