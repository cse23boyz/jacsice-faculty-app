import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId, toClientArray, toClientObject } from "@/lib/mongodb-utils";

// GET - Get all certifications for the logged-in faculty
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
    
    const certifications = await db
      .collection("certifications")
      .find({ facultyId: toObjectId(payload.id) })
      .sort({ date: -1 })
      .toArray();

    const certificationsData = toClientArray(certifications);
    return NextResponse.json(certificationsData);
  } catch (err) {
    console.error("Certifications fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create new certification
export async function POST(req: NextRequest) {
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

    const certificationData = {
      title: body.title,
      type: body.type,
      organization: body.organization,
      date: body.date,
      duration: body.duration || "",
      description: body.description || "",
      isPinned: body.isPinned || false,
      facultyId: toObjectId(payload.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("certifications").insertOne(certificationData);

    // Fetch the created certification
    const newCertification = await db.collection("certifications").findOne({
      _id: result.insertedId
    });

    if (!newCertification) {
      throw new Error("Failed to create certification");
    }

    const clientCertification = toClientObject(newCertification);

    return NextResponse.json({ 
      success: true, 
      certification: clientCertification
    }, { status: 201 });
  } catch (err) {
    console.error("Certification create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}