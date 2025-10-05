import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const CIRCULARS_FILE = path.join(DATA_DIR, 'circulars.json')

// Ensure data directory exists
const ensureDataDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Read circulars from JSON file
const readCircularsFromFile = (): any[] => {
  try {
    ensureDataDirectory()
    if (fs.existsSync(CIRCULARS_FILE)) {
      const data = fs.readFileSync(CIRCULARS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading circulars from file:', error)
  }
  
  // Return default data if file doesn't exist or error
  return [
    {
      id: 'circular_1',
      heading: 'Welcome to JACSICE Staff Portal',
      body: 'Welcome all staff members to the new academic year. We are excited to have you on board.',
      details: 'Please ensure all documentation is completed by the end of the week. Department meetings will be scheduled soon.',
      adminNote: 'Important announcement for all teaching and non-teaching staff',
      dateCreated: new Date().toISOString(),
      isPinned: true,
      createdBy: 'admin'
    }
  ]
}

// Write circulars to JSON file
const writeCircularsToFile = (circulars: any[]) => {
  try {
    ensureDataDirectory()
    fs.writeFileSync(CIRCULARS_FILE, JSON.stringify(circulars, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing circulars to file:', error)
    throw error
  }
}

export const jsonStorage = {
  getCirculars: (): any[] => {
    return readCircularsFromFile()
  },

  saveCircular: (circular: any): void => {
    const circulars = readCircularsFromFile()
    const existingIndex = circulars.findIndex(c => c.id === circular.id)
    
    if (existingIndex >= 0) {
      circulars[existingIndex] = circular
    } else {
      circulars.unshift(circular)
    }
    
    writeCircularsToFile(circulars)
  },

  deleteCircular: (id: string): void => {
    const circulars = readCircularsFromFile()
    const updatedCirculars = circulars.filter(c => c.id !== id)
    writeCircularsToFile(updatedCirculars)
  },

  getCircular: (id: string): any => {
    const circulars = readCircularsFromFile()
    return circulars.find(c => c.id === id) || null
  }
}