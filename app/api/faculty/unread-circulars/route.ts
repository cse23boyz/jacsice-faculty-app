import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyJwt } from "@/lib/jwt"

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyJwt(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const client = await clientPromise
    const db = client.db("facultyDB")

    // Example: circulars collection with field 'viewedBy' storing faculty IDs who read it
    const unreadCount = await db
      .collection("circulars")
      .countDocuments({ viewedBy: { $ne: payload.id } })

    return NextResponse.json({ count: unreadCount })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
