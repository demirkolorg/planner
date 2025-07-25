import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createTaskActivity, TaskActivityTypes, getActivityDescription } from "@/lib/task-activity"

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

    // Check if task exists and belongs to user with existing reminders
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        userId: decoded.userId
      },
      include: {
        reminders: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Mevcut ve yeni reminder'ları karşılaştır
    const currentReminders = existingTask.reminders.map(r => ({
      datetime: r.datetime.toISOString(),
      message: r.message || '',
    }))
    
    const newReminders = reminders.map((r: any) => ({
      datetime: new Date(r.datetime).toISOString(),
      message: r.message || '',
    }))

    // Eklenen ve kaldırılan reminder'ları tespit et
    const addedReminders = newReminders.filter(nr => 
      !currentReminders.some(cr => 
        cr.datetime === nr.datetime && cr.message === nr.message
      )
    )
    
    const removedReminders = currentReminders.filter(cr => 
      !newReminders.some(nr => 
        nr.datetime === cr.datetime && nr.message === cr.message
      )
    )

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

    // Aktivite logları oluştur
    for (const reminder of addedReminders) {
      const reminderText = new Date(reminder.datetime).toLocaleString('tr-TR')
      await createTaskActivity({
        taskId,
        userId: decoded.userId,
        actionType: TaskActivityTypes.REMINDER_ADDED,
        newValue: reminderText,
        description: getActivityDescription(TaskActivityTypes.REMINDER_ADDED, null, reminderText)
      })
    }

    for (const reminder of removedReminders) {
      const reminderText = new Date(reminder.datetime).toLocaleString('tr-TR')
      await createTaskActivity({
        taskId,
        userId: decoded.userId,
        actionType: TaskActivityTypes.REMINDER_REMOVED,
        oldValue: reminderText,
        description: getActivityDescription(TaskActivityTypes.REMINDER_REMOVED, reminderText, null)
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