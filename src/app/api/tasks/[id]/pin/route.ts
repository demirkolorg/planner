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
    
    // Check if task exists and user has access to it
    const existingTask = await db.task.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check current pin status for this user
    const existingPin = await db.userPin.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: decoded.userId,
          targetType: 'TASK',
          targetId: id
        }
      }
    })

    // Toggle pin status
    const newPinStatus = !existingPin
    if (newPinStatus) {
      // Pin the task
      await db.userPin.create({
        data: {
          userId: decoded.userId,
          targetType: 'TASK',
          targetId: id
        }
      })
    } else {
      // Unpin the task
      await db.userPin.delete({
        where: {
          userId_targetType_targetId: {
            userId: decoded.userId,
            targetType: 'TASK',
            targetId: id
          }
        }
      })
    }

    // Get updated task with pin status
    const updatedTask = await db.task.findUnique({
      where: { id },
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

    // Add user-specific pin status to response
    const taskWithPinStatus = {
      ...updatedTask,
      isPinned: newPinStatus
    }

    return NextResponse.json(taskWithPinStatus)
  } catch (error) {
    console.error("Error toggling task pin:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}