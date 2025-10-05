import { NextRequest, NextResponse } from 'next/server'
import { jsonStorage } from '@/lib/db/json-storage'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isPinned } = body

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

    // Update pinned status
    const updatedCircular = {
      ...existingCircular,
      isPinned: Boolean(isPinned)
    }

    jsonStorage.saveCircular(updatedCircular)

    return NextResponse.json({
      success: true,
      data: updatedCircular,
      message: `Circular ${isPinned ? 'pinned' : 'unpinned'} successfully`
    })
  } catch (error) {
    console.error('Error pinning circular:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update circular pin status'
      },
      { status: 500 }
    )
  }
}