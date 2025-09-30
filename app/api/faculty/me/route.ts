import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const client = await clientPromise;
    const db = client.db("yourDatabaseName");
    const faculty = await db.collection("faculty").findOne({ _id: new Object(decoded.id) });
    if (!faculty) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password, ...facultyData } = faculty;
    return NextResponse.json(facultyData);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
