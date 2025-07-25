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

    // Task aktivitelerini getir
    const activities = await db.taskActivity.findMany({
      where: {
        taskId: taskId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // En yeni aktiviteler önce
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching task activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}