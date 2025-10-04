import { NextResponse } from "next/server";
import Faculty from "@/models/Faculty";
import dbConnect from "@/lib/dbConnect";
import { getGmailTransporter } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Save new faculty to DB
    const faculty = new Faculty({ name, email, password });
    await faculty.save();

    // Send email with Gmail transporter
    const transporter = await getGmailTransporter();
    const info = await transporter.sendMail({
      from: `"Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Faculty Account Created",
      text: `Hello ${name},\n\nYour faculty account has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in.`,
    });

    console.log("📩 Faculty email sent:", info.messageId);

    return NextResponse.json({ success: true, faculty });
  } catch (error) {
    console.error("❌ Error in add-faculty:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
