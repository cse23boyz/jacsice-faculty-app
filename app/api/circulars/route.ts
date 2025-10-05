import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/db/json-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isPinned = searchParams.get('isPinned')

    const circulars = jsonStorage.getCirculars()

    let filteredCirculars = circulars

    // Filter by search term
    if (search) {
      filteredCirculars = circulars.filter(
        circular =>
          circular.heading.toLowerCase().includes(search.toLowerCase()) ||
          circular.body.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Filter by pinned status
    if (isPinned !== null) {
      filteredCirculars = filteredCirculars.filter(
        circular => circular.isPinned === (isPinned === 'true')
      )
    }

    // Sort: pinned first, then by date
    const sortedCirculars = filteredCirculars.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    })

    return NextResponse.json({
      success: true,
      data: sortedCirculars,
      count: sortedCirculars.length
    })
  } catch (error) {
    console.error('Error fetching circulars:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch circulars'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { heading, body: circularBody, details, adminNote, createdBy } = body

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

    // Validate length
    if (heading.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Heading must be less than 200 characters'
        },
        { status: 400 }
      )
    }

    const newCircular = {
      id: `circular_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      heading: heading.trim(),
      body: circularBody.trim(),
      details: details?.trim() || '',
      adminNote: adminNote?.trim() || '',
      dateCreated: new Date().toISOString(),
      isPinned: false,
      createdBy: createdBy || 'admin'
    }

    jsonStorage.saveCircular(newCircular)

    console.log('New circular created:', newCircular.id)
    console.log('Total circulars now:', jsonStorage.getCirculars().length)

    return NextResponse.json(
      {
        success: true,
        data: newCircular,
        message: 'Circular created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating circular:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create circular'
      },
      { status: 500 }
    )
  }
}