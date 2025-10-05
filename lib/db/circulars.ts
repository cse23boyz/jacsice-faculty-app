import { Circular } from './schema'

// Simulate database with localStorage
export const circularsDb = {
  getCirculars: (): Circular[] => {
    if (typeof window === 'undefined') return []
    const circulars = localStorage.getItem('circulars')
    return circulars ? JSON.parse(circulars) : []
  },

  saveCircular: (circular: Circular): void => {
    const circulars = circularsDb.getCirculars()
    const existingIndex = circulars.findIndex(c => c.id === circular.id)
    
    if (existingIndex >= 0) {
      circulars[existingIndex] = circular
    } else {
      circulars.unshift(circular)
    }
    
    localStorage.setItem('circulars', JSON.stringify(circulars))
  },

  deleteCircular: (id: string): void => {
    const circulars = circularsDb.getCirculars().filter(c => c.id !== id)
    localStorage.setItem('circulars', JSON.stringify(circulars))
  },

  getCircular: (id: string): Circular | null => {
    return circularsDb.getCirculars().find(c => c.id === id) || null
  }
}