 // Persistent storage for circulars that works across API routes
let circularsStorage: any[] = []

// Initialize with sample data if empty
if (circularsStorage.length === 0) {
  circularsStorage = [
    {
      id: 'circular_1',
      heading: 'Welcome to JACSICE Staff Portal',
      body: 'Welcome all staff members to the new academic year. We are excited to have you on board.',
      details: 'Please ensure all documentation is completed by the end of the week. Department meetings will be scheduled soon.',
      adminNote: 'Important announcement for all teaching and non-teaching staff',
      dateCreated: new Date().toISOString(),
      isPinned: true,
      createdBy: 'admin'
    },
    {
      id: 'circular_2',
      heading: 'Academic Calendar Update',
      body: 'The academic calendar for the upcoming semester has been updated. Please review the changes.',
      details: 'Key changes include adjusted examination dates and holiday schedules.',
      adminNote: 'All faculty members must acknowledge receipt',
      dateCreated: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      isPinned: false,
      createdBy: 'admin'
    }
  ]
}

export const persistentStorage = {
  getCirculars: (): any[] => {
    return circularsStorage
  },

  saveCircular: (circular: any): void => {
    const existingIndex = circularsStorage.findIndex(c => c.id === circular.id)
    if (existingIndex >= 0) {
      circularsStorage[existingIndex] = circular
    } else {
      circularsStorage.unshift(circular)
    }
  },

  deleteCircular: (id: string): void => {
    circularsStorage = circularsStorage.filter(c => c.id !== id)
  },

  getCircular: (id: string): any => {
    return circularsStorage.find(c => c.id === id) || null
  }
}