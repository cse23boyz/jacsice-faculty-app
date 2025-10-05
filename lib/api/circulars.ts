import { Circular } from '@/lib/db/schema'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const circularsApi = {
  // Get all circulars
  getCirculars: async (search?: string, isPinned?: boolean): Promise<{
    success: boolean
    data: Circular[]
    count: number
  }> => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (isPinned !== undefined) params.append('isPinned', isPinned.toString())

      const response = await fetch(`${API_BASE_URL}/circulars?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching circulars:', error)
      throw new Error('Failed to fetch circulars. Please try again.')
    }
  },

  // Get single circular
  getCircular: async (id: string): Promise<{
    success: boolean
    data: Circular
  }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/circulars/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching circular:', error)
      throw new Error('Failed to fetch circular. Please try again.')
    }
  },

  // Create circular
  createCircular: async (circularData: {
    heading: string
    body: string
    details?: string
    adminNote?: string
    createdBy?: string
  }): Promise<Circular> => {
    try {
      const response = await fetch(`${API_BASE_URL}/circulars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(circularData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error creating circular:', error)
      throw new Error('Failed to create circular. Please try again.')
    }
  },

  // Update circular
  updateCircular: async (
    id: string,
    circularData: {
      heading: string
      body: string
      details?: string
      adminNote?: string
    }
  ): Promise<Circular> => {
    try {
      const response = await fetch(`${API_BASE_URL}/circulars/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(circularData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error updating circular:', error)
      throw new Error('Failed to update circular. Please try again.')
    }
  },

  // Delete circular
  deleteCircular: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/circulars/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // If circular not found, it might already be deleted - we can consider this a success
        if (response.status === 404) {
          console.warn('Circular not found during deletion - it may have already been deleted')
          return
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Successfully deleted
      return
    } catch (error) {
      console.error('Error deleting circular:', error)
      
      // If it's a 404 error, the circular might already be deleted
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Circular not found - it may have already been deleted')
        return
      }
      
      throw new Error('Failed to delete circular. Please try again.')
    }
  },

  // Pin/Unpin circular
  pinCircular: async (id: string, isPinned: boolean): Promise<Circular> => {
    try {
      const response = await fetch(`${API_BASE_URL}/circulars/${id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPinned }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error pinning circular:', error)
      throw new Error('Failed to update circular pin status. Please try again.')
    }
  },
}