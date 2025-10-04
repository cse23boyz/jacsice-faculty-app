import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId } from "@/lib/mongodb-utils";
import bcrypt from "bcryptjs";

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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Current password and new password are required" 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "New password must be at least 6 characters long" 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("university");

    // Get faculty member with password
    const faculty = await db.collection("faculty").findOne({
      _id: toObjectId(payload.id)
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword, 
      faculty.password
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const result = await db.collection("faculty").updateOne(
      { _id: toObjectId(payload.id) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ 
        error: "Failed to update password" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password changed successfully" 
    });

  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}