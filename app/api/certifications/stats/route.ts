import { NextRequest, NextResponse } from "next/server";
import { readCertifications } from "../utils";

export async function GET(req: NextRequest) {
  try {
    const certifications = readCertifications();

    const stats = {
      total: certifications.length,
      withFiles: certifications.filter(c => c.certificateFile).length,
      pinned: certifications.filter(c => c.isPinned).length,
      byType: {
        conference: certifications.filter(c => c.type === "conference").length,
        fdp: certifications.filter(c => c.type === "fdp").length,
        journal: certifications.filter(c => c.type === "journal").length,
        research: certifications.filter(c => c.type === "research").length,
        seminar: certifications.filter(c => c.type === "seminar").length,
        workshop: certifications.filter(c => c.type === "workshop").length,
        project: certifications.filter(c => c.type === "project").length,
        certification: certifications.filter(c => c.type === "certification").length,
      },
      recent: certifications.filter(c => new Date(c.dateCreated) > new Date(Date.now() - 30*24*60*60*1000)).length,
      byMonth: getCertificationsByMonth(certifications)
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}

function getCertificationsByMonth(certifications: any[]) {
  const monthCount: Record<string, number> = {};
  certifications.forEach(c => {
    const date = new Date(c.dateCreated);
    const month = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}`;
    monthCount[month] = (monthCount[month] || 0) + 1;
  });
  return monthCount;
}
