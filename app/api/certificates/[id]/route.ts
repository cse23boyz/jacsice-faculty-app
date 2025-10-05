import { NextRequest, NextResponse } from 'next/server'
import { readCertifications, writeCertifications } from '../utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certifications = readCertifications()
    const certificationIndex = certifications.findIndex((c: any) => c.id === params.id)

    if (certificationIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certification not found'
        },
        { status: 404 }
      )
    }

    certifications.splice(certificationIndex, 1)
    writeCertifications(certifications)

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting certification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete certification'
      },
      { status: 500 }
    )
  }
}