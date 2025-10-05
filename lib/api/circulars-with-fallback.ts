import { Circular } from '@/lib/db/schema'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Fallback to localStorage if API fails
const getCircularsFromLocalStorage = (): Circular[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('adminCirculars')
    return saved ? JSON.parse(saved) : []
  }
  return []
}

const saveCircularsToLocalStorage = (circulars: Circular[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminCirculars', JSON.stringify(circulars))
  }
}

export const circularsApiWithFallback = {
  getCirculars: async (search?: string): Promise<{
    success: boolean
    data: Circular[]
    count: number
  }> => {
    try {
      // Try API first
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const response = await fetch(`${API_BASE_URL}/circulars?${params}`)
      
      if (response.ok) {
        return await response.json()
      }
      
      // Fallback to localStorage
      throw new Error('API failed, using fallback')
    } catch (error) {
      console.warn('Using localStorage fallback for circulars')
      const circulars = getCircularsFromLocalStorage()
      
      let filteredCirculars = circulars
      if (search) {
        filteredCirculars = circulars.filter(
          circular =>
            circular.heading.toLowerCase().includes(search.toLowerCase()) ||
            circular.body.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      const sortedCirculars = filteredCirculars.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      })
      
      return {
        success: true,
        data: sortedCirculars,
        count: sortedCirculars.length
      }
    }
  },

  deleteCircular: async (id: string): Promise<void> => {
    try {
      // Try API first
      const response = await fetch(`${API_BASE_URL}/circulars/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        return
      }
      
      // Fallback to localStorage
      throw new Error('API failed, using fallback')
    } catch (error) {
      console.warn('Using localStorage fallback for delete')
      const circulars = getCircularsFromLocalStorage()
      const updatedCirculars = circulars.filter(circular => circular.id !== id)
      saveCircularsToLocalStorage(updatedCirculars)
    }
  },

  // ... other methods with similar fallback patterns
}