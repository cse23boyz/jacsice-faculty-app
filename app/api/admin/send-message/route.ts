import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { toObjectId } from "@/lib/mongodb-utils";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token || token !== "admin-authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { facultyId, message, type } = body;

    if (!facultyId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    console.log(`Sending message to faculty ${facultyId}`);

    // Verify faculty exists
    const faculty = await db.collection("faculty").findOne({
      _id: toObjectId(facultyId)
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Store message in notifications collection
    const notification = {
      facultyId: toObjectId(facultyId),
      type: type || "admin_message",
      title: "Message from Admin",
      content: message,
      from: "Administrator",
      isRead: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    const result = await db.collection("notifications").insertOne(notification);

    console.log(`Message sent successfully with ID: ${result.insertedId}`);

    return NextResponse.json({ 
      success: true, 
      message: "Message sent successfully",
      notificationId: result.insertedId
    });
  } catch (err) {
    console.error("Send message error:", err);
    
    if (err instanceof Error && err.message.includes("Invalid ObjectId")) {
      return NextResponse.json({ error: "Invalid faculty ID" }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to send message",
      details: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}