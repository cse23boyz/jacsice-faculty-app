import { NextRequest, NextResponse } from 'next/server'

const notifications: any[] = []

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationIndex = notifications.findIndex(n => n.id === params.id)

    if (notificationIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification not found'
        },
        { status: 404 }
      )
    }

    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      isRead: true
    }

    return NextResponse.json({
      success: true,
      data: notifications[notificationIndex],
      message: 'Notification marked as read'
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification'
      },
      { status: 500 }
    )
  }
}