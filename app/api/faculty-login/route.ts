import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    const client = await clientPromise
    const db = client.db()

    // Find faculty by username
    const faculty = await db.collection("faculties").findOne({ username })
    if (!faculty) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, faculty.password)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      { id: faculty._id, username: faculty.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    )

    return NextResponse.json({
      message: "Login successful",
      token,
      faculty: {
        id: faculty._id,
        fullName: faculty.fullName,
        email: faculty.email,
        facultyCode: faculty.facultyCode,
        username: faculty.username,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
