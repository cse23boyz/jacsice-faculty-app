import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/university";

if (!mongoose.connection.readyState) {
  mongoose.connect(MONGO_URI, { dbName: "university" });
}

const facultySchema = new mongoose.Schema({
  name: String,
  email: String,
  facultyCode: String,
  username: { type: String, unique: true },
  password: String,
});

const Faculty =
  mongoose.models.Faculty || mongoose.model("Faculty", facultySchema);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const faculty = await Faculty.findOne({ username });

    if (!faculty) {
      return NextResponse.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Incorrect password" });
    }

    return NextResponse.json({ success: true, facultyId: faculty._id });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
