import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { fullName, email, facultyCode, username, password } = body

    const client = await clientPromise
    const db = client.db("facultyDB")

    // check duplicates
    const existing = await db.collection("faculties").findOne({
      $or: [{ email }, { facultyCode }, { username }],
    })

    if (existing) {
      return NextResponse.json(
        { error: "Faculty with same Email / Code / Username already exists" },
        { status: 400 }
      )
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.collection("faculties").insertOne({
      fullName,
      email,
      facultyCode,
      username,
      password: hashedPassword,
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "Faculty added successfully" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
