import { Circular } from './schema'

const STORAGE_KEY = 'jacsice_circulars'

export const localStorageDb = {
  getCirculars: (): Circular[] => {
    if (typeof window === 'undefined') {
      return []
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
    
    // Default data
    return [
      {
        id: 'circular_1',
        heading: 'Welcome to JACSICE Staff Portal',
        body: 'Welcome all staff members to the new academic year.',
        details: 'Please ensure all documentation is completed by the end of the week.',
        adminNote: 'Important announcement for all staff',
        dateCreated: new Date().toISOString(),
        isPinned: true,
        createdBy: 'admin'
      }
    ]
  },

  saveCirculars: (circulars: Circular[]): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(circulars))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  },

  saveCircular: (circular: Circular): void => {
    const circulars = localStorageDb.getCirculars()
    const existingIndex = circulars.findIndex(c => c.id === circular.id)
    
    if (existingIndex >= 0) {
      circulars[existingIndex] = circular
    } else {
      circulars.unshift(circular)
    }
    
    localStorageDb.saveCirculars(circulars)
  },

  deleteCircular: (id: string): void => {
    const circulars = localStorageDb.getCirculars()
    const updatedCirculars = circulars.filter(c => c.id !== id)
    localStorageDb.saveCirculars(updatedCirculars)
  },

  getCircular: (id: string): Circular | null => {
    const circulars = localStorageDb.getCirculars()
    return circulars.find(c => c.id === id) || null
  }
}