import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id: taskId } = await params
    
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

    // Ana yorumları ve reply'ları getir (parent comment'ler için parentId null)
    const comments = await db.comment.findMany({
      where: {
        taskId: taskId,
        parentId: null // Sadece ana yorumları getir
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc' // Reply'lar tarihe göre sıralı
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // En yeni yorumlar önce
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id: taskId } = await params
    const { content, parentId } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

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

    // Eğer parentId varsa, parent comment'in varlığını ve aynı task'a ait olduğunu kontrol et
    if (parentId) {
      const parentComment = await db.comment.findFirst({
        where: {
          id: parentId,
          taskId: taskId
        }
      })

      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
      }
    }

    // Transaction kullanarak yorum ekleme ve aktivite kaydı
    const result = await db.$transaction(async (tx) => {
      // Yorumu ekle
      const comment = await tx.comment.create({
        data: {
          content: content.trim(),
          taskId,
          userId: decoded.userId,
          parentId: parentId || undefined
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Aktivite kaydı ekle
      await tx.taskActivity.create({
        data: {
          taskId,
          userId: decoded.userId,
          actionType: "comment_added",
          description: parentId 
            ? `Göreve yanıt eklendi: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
            : `Göreve yorum eklendi: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          newValue: content
        }
      })

      return comment
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}