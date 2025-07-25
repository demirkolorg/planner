import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id: taskId, commentId } = await params
    
    // Görevin kullanıcıya ait olduğunu kontrol et
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        userId: decoded.userId
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Yorumun varlığını ve kullanıcıya ait olduğunu kontrol et
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        taskId: taskId,
        userId: decoded.userId // Sadece kendi yorumunu silebilir
      }
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found or unauthorized" }, { status: 404 })
    }

    // Transaction kullanarak yorumu silme ve aktivite kaydı
    await db.$transaction(async (tx) => {
      // Yorumu sil (replies cascade olarak silinecek)
      await tx.comment.delete({
        where: {
          id: commentId
        }
      })

      // Aktivite kaydı ekle
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: decoded.userId,
          actionType: "comment_deleted",
          description: `Yorum silindi: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"`,
          oldValue: comment.content
        }
      })
    })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}