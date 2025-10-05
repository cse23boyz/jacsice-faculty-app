import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'

// Database file path
const DATA_DIR = path.join(process.cwd(), 'data')
const CERTIFICATIONS_FILE = path.join(DATA_DIR, 'certifications.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Read certifications from JSON file
const readCertifications = (): any[] => {
  try {
    ensureDataDirectory()
    if (existsSync(CERTIFICATIONS_FILE)) {
      const data = readFileSync(CERTIFICATIONS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading certifications:', error)
  }
  return []
}

// Write certifications to JSON file
const writeCertifications = (certifications: any[]) => {
  try {
    ensureDataDirectory()
    writeFileSync(CERTIFICATIONS_FILE, JSON.stringify(certifications, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing certifications:', error)
    throw error
  }
}

// GET - Fetch all certifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const createdBy = searchParams.get('createdBy')

    let certifications = readCertifications()

    // Filter by type
    if (type) {
      certifications = certifications.filter((cert: any) => cert.type === type)
    }

    // Filter by creator
    if (createdBy) {
      certifications = certifications.filter((cert: any) => cert.createdBy === createdBy)
    }

    // Search in title and organization
    if (search) {
      certifications = certifications.filter((cert: any) =>
        cert.title.toLowerCase().includes(search.toLowerCase()) ||
        cert.organization.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort by date created (newest first)
    certifications.sort((a: any, b: any) => 
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    )

    return NextResponse.json({
      success: true,
      data: certifications,
      count: certifications.length,
      message: 'Certifications fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create new certification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      type, 
      organization, 
      date, 
      duration, 
      description, 
      certificateFile, 
      fileName, 
      createdBy,
      isPinned = false 
    } = body

    // Validation
    if (!title || !type || !organization || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, type, organization, and date are required'
        },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['conference', 'fdp', 'journal', 'research', 'seminar', 'project', 'workshop', 'certification']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
        },
        { status: 400 }
      )
    }

    const certifications = readCertifications()

    // Check for duplicates (same title and organization)
    const duplicate = certifications.find((cert: any) => 
      cert.title.toLowerCase() === title.toLowerCase() && 
      cert.organization.toLowerCase() === organization.toLowerCase()
    )

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A certification with this title and organization already exists'
        },
        { status: 409 }
      )
    }

    const newCertification = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      type,
      organization: organization.trim(),
      date,
      duration: duration?.trim() || '',
      description: description?.trim() || '',
      certificateFile: certificateFile || '',
      fileName: fileName || '',
      isPinned: Boolean(isPinned),
      dateCreated: new Date().toISOString(),
      createdBy: createdBy || 'staff',
      lastUpdated: new Date().toISOString()
    }

    certifications.unshift(newCertification)
    writeCertifications(certifications)

    console.log('New certification created:', newCertification.id)
    console.log('Total certifications:', certifications.length)

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
        error: 'Failed to create certification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}