import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Get attachment with task info to verify ownership
    const attachment = await db.attachment.findFirst({
      where: { id },
      include: {
        task: true
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Check if user owns the task that contains this attachment
    if (attachment.task.userId !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', attachment.fileUrl)
      await unlink(filePath)
    } catch (error) {
      console.warn("Could not delete file:", attachment.fileUrl, error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment record
    await db.attachment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}