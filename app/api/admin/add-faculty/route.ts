import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcrypt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, username, password, facultyCode } = body

    if (!name || !email || !username || !password || !facultyCode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("facultyDB")

    const existing = await db.collection("faculty").findOne({ username })
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newFaculty = {
      name,
      email,
      username,
      facultyCode,
      password: hashedPassword,
      createdAt: new Date(),
    }

    const result = await db.collection("faculty").insertOne(newFaculty)
    return NextResponse.json({ success: true, facultyId: result.insertedId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
