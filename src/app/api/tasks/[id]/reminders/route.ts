import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id: taskId } = await params
    const body = await request.json()
    const { reminders } = body
    
    if (!Array.isArray(reminders)) {
      return NextResponse.json({ error: "reminders must be an array" }, { status: 400 })
    }

    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        userId: decoded.userId
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Delete existing reminders
    await db.reminder.deleteMany({
      where: {
        taskId
      }
    })

    // Create new reminders
    if (reminders.length > 0) {
      await db.reminder.createMany({
        data: reminders.map((reminder: {
          datetime: Date | string
          message?: string
          isActive?: boolean
        }) => ({
          taskId,
          datetime: new Date(reminder.datetime),
          message: reminder.message || null,
          isActive: reminder.isActive !== false // Default to true if not specified
        }))
      })
    }

    // Return updated task with reminders
    const updatedTask = await db.task.findFirst({
      where: { id: taskId },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reminders: true,
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            reminders: true,
          }
        },
        section: true,
        project: true
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task reminders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}