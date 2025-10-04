import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyJwt } from "@/lib/jwt";
import { toObjectId } from "@/lib/mongodb-utils";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload?.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "pdf";

    const client = await clientPromise;
    const db = client.db("university");
    
    const faculty = await db.collection("faculty").findOne(
      { _id: toObjectId(payload.id) },
      { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } }
    );

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const certifications = await db
      .collection("certifications")
      .find({ facultyId: toObjectId(payload.id) })
      .toArray();

    if (format === "pdf") {
      return generatePDF(faculty, certifications);
    } else if (format === "xlsx") {
      return generateExcel(faculty, certifications);
    } else {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

function generatePDF(faculty: any, certifications: any[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(`Faculty Profile - ${faculty.fullName}`, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Department: ${faculty.department}`, 20, 40);
  doc.text(`Designation: ${faculty.designation}`, 20, 50);
  doc.text(`Email: ${faculty.email}`, 20, 60);
  
  if (faculty.specialization) {
    doc.text(`Specialization: ${faculty.specialization}`, 20, 70);
  }
  
  let yPosition = 90;
  doc.text("Certifications:", 20, yPosition);
  yPosition += 10;
  
  certifications.forEach((cert, index) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(`${index + 1}. ${cert.title}`, 25, yPosition);
    doc.text(`   Organization: ${cert.organization}`, 25, yPosition + 6);
    doc.text(`   Date: ${new Date(cert.date).toLocaleDateString()}`, 25, yPosition + 12);
    yPosition += 20;
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="profile_${faculty.fullName}.pdf"`
    }
  });
}

function generateExcel(faculty: any, certifications: any[]) {
  const workbook = XLSX.utils.book_new();
  
  // Profile sheet
  const profileData = [
    ['Faculty Profile Information'],
    [''],
    ['Field', 'Value'],
    ['Full Name', faculty.fullName],
    ['Department', faculty.department],
    ['Designation', faculty.designation],
    ['Email', faculty.email],
    ['Phone', faculty.phone || ''],
    ['Specialization', faculty.specialization || ''],
    ['Experience', faculty.experience || ''],
    ['Qualification', faculty.qualification || ''],
    ['Date of Joining', faculty.dateOfJoining ? new Date(faculty.dateOfJoining).toLocaleDateString() : ''],
    ['Bio', faculty.bio || ''],
    [''],
    ['Generated on', new Date().toLocaleDateString()]
  ];
  
  const profileSheet = XLSX.utils.aoa_to_sheet(profileData);
  
  // Set column widths for profile sheet
  const profileColWidths = [
    { wch: 20 }, // Field column
    { wch: 40 }  // Value column
  ];
  profileSheet['!cols'] = profileColWidths;
  
  XLSX.utils.book_append_sheet(workbook, profileSheet, 'Profile');
  
  // Certifications sheet
  const certsData = certifications.map(cert => ({
    'Title': cert.title,
    'Type': cert.type.charAt(0).toUpperCase() + cert.type.slice(1),
    'Organization': cert.organization,
    'Date': new Date(cert.date).toLocaleDateString(),
    'Duration': cert.duration || '',
    'Description': cert.description || '',
    'Pinned': cert.isPinned ? 'Yes' : 'No'
  }));
  
  if (certsData.length > 0) {
    const certsSheet = XLSX.utils.json_to_sheet(certsData);
    
    // Set column widths for certifications sheet
    const certsColWidths = [
      { wch: 30 }, // Title
      { wch: 15 }, // Type
      { wch: 25 }, // Organization
      { wch: 12 }, // Date
      { wch: 15 }, // Duration
      { wch: 40 }, // Description
      { wch: 10 }  // Pinned
    ];
    certsSheet['!cols'] = certsColWidths;
    
    XLSX.utils.book_append_sheet(workbook, certsSheet, 'Certifications');
  }
  
  // Summary sheet
  const summaryData = [
    ['Certification Summary'],
    [''],
    ['Type', 'Count'],
    ['Conferences', certifications.filter(c => c.type === 'conference').length],
    ['FDPs', certifications.filter(c => c.type === 'fdp').length],
    ['Journal Publications', certifications.filter(c => c.type === 'journal').length],
    ['Research Projects', certifications.filter(c => c.type === 'research').length],
    ['Seminars', certifications.filter(c => c.type === 'seminar').length],
    ['Projects Guided', certifications.filter(c => c.type === 'project').length],
    [''],
    ['Total Certifications', certifications.length],
    ['Pinned Certifications', certifications.filter(c => c.isPinned).length],
    [''],
    ['Report Generated', new Date().toLocaleString()]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    bookSST: false
  });
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="profile_${faculty.fullName}.xlsx"`
    }
  });
}