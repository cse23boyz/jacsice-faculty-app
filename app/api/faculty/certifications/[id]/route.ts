import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId, toClientObject } from "@/lib/mongodb-utils";

// GET - Get single certification by ID
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
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    // Get certification (only if owned by the user)
    const certification = await db.collection("certifications").findOne({
      _id: toObjectId(params.id),
      facultyId: toObjectId(payload.id)
    });

    if (!certification) {
      return NextResponse.json({ 
        error: "Certification not found" 
      }, { status: 404 });
    }

    const certificationData = toClientObject(certification);

    return NextResponse.json({ 
      success: true, 
      certification: certificationData 
    });
  } catch (err) {
    console.error("Certification fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update certification by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate required fields
    if (!body.title || !body.type || !body.organization || !body.date) {
      return NextResponse.json({ 
        error: "Missing required fields: title, type, organization, date" 
      }, { status: 400 });
    }

    // Update certification (only if owned by the user)
    const result = await db.collection("certifications").updateOne(
      { 
        _id: toObjectId(params.id),
        facultyId: toObjectId(payload.id)
      },
      {
        $set: {
          title: body.title,
          type: body.type,
          organization: body.organization,
          date: body.date,
          duration: body.duration || "",
          description: body.description || "",
          isPinned: body.isPinned || false,
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: "Certification not found or no changes made" 
      }, { status: 404 });
    }

    // Fetch the updated certification
    const updatedCertification = await db.collection("certifications").findOne({
      _id: toObjectId(params.id)
    });

    if (!updatedCertification) {
      return NextResponse.json({ 
        error: "Certification not found after update" 
      }, { status: 404 });
    }

    const certificationData = toClientObject(updatedCertification);

    return NextResponse.json({ 
      success: true, 
      certification: certificationData 
    });
  } catch (err) {
    console.error("Certification update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Delete certification by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete certification (only if owned by the user)
    const result = await db.collection("certifications").deleteOne({
      _id: toObjectId(params.id),
      facultyId: toObjectId(payload.id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: "Certification not found or you don't have permission to delete it" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Certification deleted successfully" 
    });
  } catch (err) {
    console.error("Certification delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}