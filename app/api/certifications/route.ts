import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for certifications
let certifications: any[] = []

export async function GET(request: NextRequest) {
  try {
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
    
    const newCertification = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      dateCreated: new Date().toISOString(),
      isPinned: false
    }

    certifications.unshift(newCertification)

    return NextResponse.json(
      {
        success: true,
        data: newCertification,
        message: 'Certification created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create certification'
      },
      { status: 500 }
    )
  }
}