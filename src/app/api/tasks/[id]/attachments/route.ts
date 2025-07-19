import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'text/markdown', 
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "File type not supported. Only text, markdown, PDF and image files are allowed." 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'tasks', id)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = path.join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create attachment record
    const attachment = await db.attachment.create({
      data: {
        taskId: id,
        fileName: file.name,
        fileType: file.type,
        fileUrl: `/uploads/tasks/${id}/${fileName}`,
        fileSize: file.size
      }
    })

    return NextResponse.json(attachment)
  } catch (error) {
    console.error("Error uploading attachment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Get attachments for this task
    const attachments = await db.attachment.findMany({
      where: {
        taskId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error("Error fetching attachments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}