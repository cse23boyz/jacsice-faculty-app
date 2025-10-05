import { NextRequest, NextResponse } from "next/server";
import { readCertifications, writeCertifications } from "@/app/api/certifications/utils";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const allCerts = readCertifications();
    const facultyCerts = allCerts.filter(c => c.createdBy === id);

    return NextResponse.json({ success: true, data: facultyCerts, count: facultyCerts.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch certifications" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const certs = readCertifications();
    const index = certs.findIndex(c => c.id === id);
    if (index === -1) return NextResponse.json({ success: false, error: "Certification not found" }, { status: 404 });

    certs[index] = { ...certs[index], ...body, lastUpdated: new Date().toISOString() };
    writeCertifications(certs);

    return NextResponse.json({ success: true, data: certs[index], message: "Certification updated" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update certification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const certs = readCertifications();
    const index = certs.findIndex(c => c.id === id);
    if (index === -1) return NextResponse.json({ success: false, error: "Certification not found" }, { status: 404 });

    const deleted = certs.splice(index, 1)[0];
    writeCertifications(certs);

    return NextResponse.json({ success: true, data: deleted, message: "Certification deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete certification" }, { status: 500 });
  }
}
