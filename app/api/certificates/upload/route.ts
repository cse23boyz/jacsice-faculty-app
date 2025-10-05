import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import path from 'path'

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'application/pdf'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('certificate') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided'
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'certificates')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substr(2, 9)
    const originalName = file.name
    const extension = path.extname(originalName)
    const fileName = `certificate_${timestamp}_${randomString}${extension}`
    const filePath = path.join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    try {
      writeFileSync(filePath, buffer)
    } catch (writeError) {
      console.error('Error writing file:', writeError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save file to server'
        },
        { status: 500 }
      )
    }

    const fileUrl = `/uploads/certificates/${fileName}`

    console.log('File uploaded successfully:', {
      originalName,
      savedName: fileName,
      size: file.size,
      type: file.type,
      url: fileUrl
    })

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: originalName,
        savedFileName: fileName,
        fileSize: file.size,
        fileType: file.type
      },
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'File name is required'
        },
        { status: 400 }
      )
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', 'certificates', fileName)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File not found'
        },
        { status: 404 }
      )
    }

    // Delete the file
    unlinkSync(filePath)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}