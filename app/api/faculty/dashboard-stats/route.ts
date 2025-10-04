import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId } from "@/lib/mongodb-utils";

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
    const facultyId = toObjectId(payload.id);

    const certificationStats = await db
      .collection("certifications")
      .aggregate([
        { $match: { facultyId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const pinnedCount = await db
      .collection("certifications")
      .countDocuments({ facultyId, isPinned: true });

    const totalCertifications = await db
      .collection("certifications")
      .countDocuments({ facultyId });

    const unreadCirculars = await db
      .collection("circulars")
      .countDocuments({ 
        viewedBy: { $ne: facultyId } 
      });

    const stats: any = {
      totalCertifications,
      pinned: pinnedCount,
      unreadCirculars,
      upcomingEvents: 0,
      pendingTasks: 0
    };

    const types = ['conference', 'fdp', 'journal', 'research', 'seminar', 'project'];
    types.forEach(type => {
      stats[type] = 0;
    });

    certificationStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}