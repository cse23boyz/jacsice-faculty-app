import { NextRequest, NextResponse } from 'next/server'
import { readCertifications, writeCertifications } from '../route'

// GET - Get single certification by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certifications = readCertifications()
    const certification = certifications.find((cert: any) => cert.id === params.id)

    if (!certification) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: certification,
      message: 'Certification fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching certification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update certification
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, type, organization, date, duration, description, certificateFile, fileName, isPinned } = body

    const certifications = readCertifications()
    const certificationIndex = certifications.findIndex((cert: any) => cert.id === params.id)

    if (certificationIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found'
        },
        { status: 404 }
      )
    }

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

    // Update certification
    certifications[certificationIndex] = {
      ...certifications[certificationIndex],
      title: title.trim(),
      type,
      organization: organization.trim(),
      date,
      duration: duration?.trim() || '',
      description: description?.trim() || '',
      certificateFile: certificateFile || certifications[certificationIndex].certificateFile,
      fileName: fileName || certifications[certificationIndex].fileName,
      isPinned: Boolean(isPinned),
      lastUpdated: new Date().toISOString()
    }

    writeCertifications(certifications)

    return NextResponse.json({
      success: true,
      data: certifications[certificationIndex],
      message: 'Certification updated successfully'
    })
  } catch (error) {
    console.error('Error updating certification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update certification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete certification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certifications = readCertifications()
    const certificationIndex = certifications.findIndex((cert: any) => cert.id === params.id)

    if (certificationIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found'
        },
        { status: 404 }
      )
    }

    const deletedCertification = certifications[certificationIndex]
    
    // Remove certification from array
    certifications.splice(certificationIndex, 1)
    writeCertifications(certifications)

    console.log('Certification deleted:', params.id)
    console.log('Total certifications remaining:', certifications.length)

    return NextResponse.json({
      success: true,
      data: deletedCertification,
      message: 'Certification deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting certification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete certification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}