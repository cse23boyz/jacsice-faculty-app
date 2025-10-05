import { NextRequest, NextResponse } from 'next/server'
import { readCertifications } from '../route'

export async function GET(request: NextRequest) {
  try {
    const certifications = readCertifications()
    
    const stats = {
      total: certifications.length,
      withFiles: certifications.filter(cert => cert.certificateFile).length,
      byType: {
        conference: certifications.filter(c => c.type === 'conference').length,
        fdp: certifications.filter(c => c.type === 'fdp').length,
        journal: certifications.filter(c => c.type === 'journal').length,
        research: certifications.filter(c => c.type === 'research').length,
        seminar: certifications.filter(c => c.type === 'seminar').length,
        workshop: certifications.filter(c => c.type === 'workshop').length,
        project: certifications.filter(c => c.type === 'project').length,
        certification: certifications.filter(c => c.type === 'certification').length,
      },
      byMonth: getCertificationsByMonth(certifications),
      pinned: certifications.filter(c => c.isPinned).length,
      recent: certifications.filter(c => {
        const certDate = new Date(c.dateCreated)
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return certDate > monthAgo
      }).length
    }

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Statistics fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics'
      },
      { status: 500 }
    )
  }
}

function getCertificationsByMonth(certifications: any[]) {
  const monthCount: { [key: string]: number } = {}
  
  certifications.forEach(cert => {
    const date = new Date(cert.dateCreated)
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    monthCount[monthYear] = (monthCount[monthYear] || 0) + 1
  })
  
  return monthCount
}