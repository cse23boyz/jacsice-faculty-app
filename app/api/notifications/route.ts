import { NextRequest, NextResponse } from 'next/server'

interface Notification {
  id: string
  type: 'circular' | 'announcement' | 'alert'
  title: string
  content: string
  circularId?: string
  from: string
  timestamp: string
  isRead: boolean
  userId: string
}

// Mock database
const notifications: Notification[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required'
        },
        { status: 400 }
      )
    }

    const userNotifications = notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      data: userNotifications,
      count: userNotifications.length,
      unreadCount: userNotifications.filter(n => !n.isRead).length
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, content, circularId, from, userId } = body

    if (!type || !title || !content || !from || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required'
        },
        { status: 400 }
      )
    }

    const newNotification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      content,
      circularId,
      from,
      timestamp: new Date().toISOString(),
      isRead: false,
      userId
    }

    notifications.unshift(newNotification)

    return NextResponse.json(
      {
        success: true,
        data: newNotification,
        message: 'Notification created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification'
      },
      { status: 500 }
    )
  }
}