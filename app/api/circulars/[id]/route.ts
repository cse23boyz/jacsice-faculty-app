import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/db/json-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const circular = jsonStorage.getCircular(params.id)

    if (!circular) {
      return NextResponse.json(
        {
          success: false,
          error: 'Circular not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: circular
    })
  } catch (error) {
    console.error('Error fetching circular:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch circular'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { heading, body: circularBody, details, adminNote } = body

    const existingCircular = jsonStorage.getCircular(params.id)

    if (!existingCircular) {
      return NextResponse.json(
        {
          success: false,
          error: 'Circular not found'
        },
        { status: 404 }
      )
    }

    // Validation
    if (!heading || !circularBody) {
      return NextResponse.json(
        {
          success: false,
          error: 'Heading and body are required'
        },
        { status: 400 }
      )
    }

    // Update circular
    const updatedCircular = {
      ...existingCircular,
      heading: heading.trim(),
      body: circularBody.trim(),
      details: details?.trim() || '',
      adminNote: adminNote?.trim() || ''
    }

    jsonStorage.saveCircular(updatedCircular)

    return NextResponse.json({
      success: true,
      data: updatedCircular,
      message: 'Circular updated successfully'
    })
  } catch (error) {
    console.error('Error updating circular:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update circular'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingCircular = jsonStorage.getCircular(params.id)

    if (!existingCircular) {
      return NextResponse.json(
        {
          success: false,
          error: 'Circular not found'
        },
        { status: 404 }
      )
    }

    jsonStorage.deleteCircular(params.id)

    console.log('Circular deleted:', params.id)
    console.log('Total circulars now:', jsonStorage.getCirculars().length)

    return NextResponse.json({
      success: true,
      message: 'Circular deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting circular:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete circular'
      },
      { status: 500 }
    )
  }
}