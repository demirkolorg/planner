import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createTaskActivity, TaskActivityTypes, getActivityDescription } from "@/lib/task-activity"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Toggle pin status
    const newPinStatus = !existingTask.isPinned
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        isPinned: newPinStatus
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
              }
        },
        project: true,
        section: true
      }
    })

    // Aktivite kaydı
    await createTaskActivity({
      taskId: id,
      userId: decoded.userId,
      actionType: newPinStatus ? TaskActivityTypes.PINNED : TaskActivityTypes.UNPINNED,
      description: getActivityDescription(newPinStatus ? TaskActivityTypes.PINNED : TaskActivityTypes.UNPINNED)
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error toggling task pin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}