import { NextRequest, NextResponse } from "next/server";
import { readCertifications, writeCertifications } from "./utils";

// GET all certifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const createdBy = searchParams.get("createdBy");

    let certifications = readCertifications();

    if (type) certifications = certifications.filter(c => c.type === type);
    if (createdBy) certifications = certifications.filter(c => c.createdBy === createdBy);
    if (search)
      certifications = certifications.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.organization.toLowerCase().includes(search.toLowerCase())
      );

    certifications.sort(
      (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    return NextResponse.json({ success: true, data: certifications, count: certifications.length });
  } catch (err) {
    console.error("Error fetching certifications:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch certifications" }, { status: 500 });
  }
}

// POST create new certification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, type, organization, date, duration, description, certificateFile, fileName, createdBy, isPinned = false } = body;

    if (!title || !type || !organization || !date)
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });

    const validTypes = ["conference","fdp","journal","research","seminar","project","workshop","certification"];
    if (!validTypes.includes(type))
      return NextResponse.json({ success: false, error: `Invalid type. Must be one of ${validTypes.join(", ")}` }, { status: 400 });

    const certifications = readCertifications();
    if (certifications.find(c => c.title.toLowerCase() === title.toLowerCase() && c.organization.toLowerCase() === organization.toLowerCase()))
      return NextResponse.json({ success: false, error: "Duplicate certification" }, { status: 409 });

    const newCert = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      type,
      organization: organization.trim(),
      date,
      duration: duration?.trim() || "",
      description: description?.trim() || "",
      certificateFile: certificateFile || "",
      fileName: fileName || "",
      isPinned: Boolean(isPinned),
      dateCreated: new Date().toISOString(),
      createdBy: createdBy || "staff",
      lastUpdated: new Date().toISOString()
    };

    certifications.unshift(newCert);
    writeCertifications(certifications);

    return NextResponse.json({ success: true, data: newCert, message: "Certification created" }, { status: 201 });
  } catch (err) {
    console.error("Error creating certification:", err);
    return NextResponse.json({ success: false, error: "Failed to create certification" }, { status: 500 });
  }
}
