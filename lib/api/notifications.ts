export interface Notification {
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const notificationsApi = {
  createNotification: async (notificationData: {
    type: 'circular' | 'announcement' | 'alert'
    title: string
    content: string
    circularId?: string
    from: string
    userId: string
  }): Promise<Notification> => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create notification')
    }

    const result = await response.json()
    return result.data
  },
}