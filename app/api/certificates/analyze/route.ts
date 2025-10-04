import { NextRequest, NextResponse } from "next/server";
import Tesseract from 'tesseract.js';
import { verifyJwt } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await req.formData();
    const certificate = formData.get("certificate") as File;

    if (!certificate) {
      return NextResponse.json({ error: "No certificate provided" }, { status: 400 });
    }

    const arrayBuffer = await certificate.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => console.log(m)
    });

    const analyzedData = analyzeCertificateText(text);
    return NextResponse.json(analyzedData);
  } catch (err) {
    console.error("Certificate analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

function analyzeCertificateText(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  
  const analyzedData = {
    title: extractTitle(lines),
    organization: extractOrganization(lines),
    date: extractDate(lines),
    type: extractType(text),
    duration: extractDuration(text),
    description: extractDescription(lines)
  };

  return analyzedData;
}

function extractTitle(lines: string[]): string {
  return lines[0]?.trim() || "Professional Certificate";
}

function extractOrganization(lines: string[]): string {
  const orgIndicators = ['university', 'institute', 'college', 'academy', 'foundation', 'organization'];
  for (const line of lines) {
    if (orgIndicators.some(indicator => line.toLowerCase().includes(indicator))) {
      return line.trim();
    }
  }
  return "Professional Organization";
}

function extractDate(lines: string[]): string {
  const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b|\b\d{4}\b/i;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) return match[0];
  }
  return new Date().toISOString().split('T')[0];
}

function extractType(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('conference') || lowerText.includes('workshop')) return 'conference';
  if (lowerText.includes('fdp') || lowerText.includes('faculty development')) return 'fdp';
  if (lowerText.includes('journal') || lowerText.includes('publication')) return 'journal';
  if (lowerText.includes('research') || lowerText.includes('project')) return 'research';
  if (lowerText.includes('seminar') || lowerText.includes('webinar')) return 'seminar';
  return 'conference';
}

function extractDuration(text: string): string {
  const durationPattern = /\b(\d+)\s*(day|week|month|year)s?\b/i;
  const match = text.match(durationPattern);
  return match ? `${match[1]} ${match[2].toLowerCase()}s` : "1 day";
}

function extractDescription(lines: string[]): string {
  return lines.slice(0, 3).filter(line => line.length > 10).join(' ').substring(0, 200);
}