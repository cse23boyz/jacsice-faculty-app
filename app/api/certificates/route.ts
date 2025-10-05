import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

// Simple JSON-based database for certifications
const DATA_DIR = path.join(process.cwd(), 'data')
const CERTIFICATIONS_FILE = path.join(DATA_DIR, 'certifications.json')

const ensureDataDirectory = () => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

const readCertifications = (): any[] => {
  try {
    ensureDataDirectory()
    if (existsSync(CERTIFICATIONS_FILE)) {
      const data = require('fs').readFileSync(CERTIFICATIONS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading certifications:', error)
  }
  return []
}

const writeCertifications = (certifications: any[]) => {
  try {
    ensureDataDirectory()
    writeFileSync(CERTIFICATIONS_FILE, JSON.stringify(certifications, null, 2))
  } catch (error) {
    console.error('Error writing certifications:', error)
    throw error
  }
}

export async function GET() {
  try {
    const certifications = readCertifications()
    return NextResponse.json({
      success: true,
      data: certifications,
      count: certifications.length
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certifications'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, organization, date, duration, description, certificateFile, fileName, createdBy } = body

    if (!title || !type || !organization || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, type, organization, and date are required'
        },
        { status: 400 }
      )
    }

    const certifications = readCertifications()

    const newCertification = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type,
      organization,
      date,
      duration: duration || '',
      description: description || '',
      certificateFile: certificateFile || '',
      fileName: fileName || '',
      isPinned: false,
      dateCreated: new Date().toISOString(),
      createdBy: createdBy || 'staff'
    }

    certifications.unshift(newCertification)
    writeCertifications(certifications)

    return NextResponse.json(
      {
        success: true,
        data: newCertification,
        message: 'Certification created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating certification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create certification'
      },
      { status: 500 }
    )
  }
}