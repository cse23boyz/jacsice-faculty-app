import { NextRequest, NextResponse } from "next/server";
import { readCertifications, writeCertifications } from "../utils";

// GET – Get single certification by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certifications = readCertifications();
    const certification = certifications.find(
      (cert: any) => cert.id === params.id
    );

    if (!certification) {
      return NextResponse.json(
        { success: false, error: "Certification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: certification,
      message: "Certification fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching certification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch certification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT – Update certification
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      organization,
      date,
      duration,
      description,
      certificateFile,
      fileName,
      isPinned,
    } = body;

    const certifications = readCertifications();
    const index = certifications.findIndex((cert: any) => cert.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Certification not found" },
        { status: 404 }
      );
    }

    if (!title || !type || !organization || !date) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: title, type, organization, and date are required",
        },
        { status: 400 }
      );
    }

    certifications[index] = {
      ...certifications[index],
      title: title.trim(),
      type,
      organization: organization.trim(),
      date,
      duration: duration?.trim() || "",
      description: description?.trim() || "",
      certificateFile:
        certificateFile || certifications[index].certificateFile,
      fileName: fileName || certifications[index].fileName,
      isPinned: Boolean(isPinned),
      lastUpdated: new Date().toISOString(),
    };

    writeCertifications(certifications);

    return NextResponse.json({
      success: true,
      data: certifications[index],
      message: "Certification updated successfully",
    });
  } catch (error) {
    console.error("Error updating certification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update certification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE – Remove certification
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certifications = readCertifications();
    const index = certifications.findIndex((cert: any) => cert.id === params.id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Certification not found" },
        { status: 404 }
      );
    }

    const deleted = certifications[index];
    certifications.splice(index, 1);
    writeCertifications(certifications);

    return NextResponse.json({
      success: true,
      data: deleted,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete certification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
