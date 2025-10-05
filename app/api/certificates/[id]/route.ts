import { NextRequest, NextResponse } from "next/server";
import { readCertifications, writeCertifications } from "../utils"; // import from shared utils

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // <-- note the Promise
) {
  const { id } = await context.params; // must await

  try {
    const certifications = readCertifications();
    const index = certifications.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Certification not found" }, { status: 404 });
    }

    const deletedCert = certifications.splice(index, 1)[0];
    writeCertifications(certifications);

    return NextResponse.json({ success: true, data: deletedCert, message: "Certification deleted successfully" });
  } catch (err) {
    console.error("Error deleting certification:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete certification", details: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
