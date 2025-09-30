import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { verifyJwt } from "@/lib/jwt" // helper to verify JWT

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyJwt(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const client = await clientPromise
    const db = client.db("facultyDB")
    const faculty = await db.collection("faculty").findOne({ _id: new Object(payload.id) }, { projection: { password: 0 } })

    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 })

    return NextResponse.json(faculty)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
