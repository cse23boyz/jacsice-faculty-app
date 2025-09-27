import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    mongoUri: process.env.MONGO_URI ? "Loaded ✅" : "Not found ❌",
    emailUser: process.env.EMAIL_USER ? "Loaded ✅" : "Not found ❌",
    emailPass: process.env.EMAIL_PASS ? "Loaded ✅" : "Not found ❌",
  });
}
