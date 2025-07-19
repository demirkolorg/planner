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
    const { id } = await params
    const body = await request.json()
    
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

    // Update task
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reminders: true,
        attachments: true,
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            reminders: true,
            attachments: true
          }
        },
        section: true
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Delete task (this will also delete sub-tasks due to cascade)
    await db.task.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
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
    
    // Get task with all relations
    const task = await db.task.findFirst({
      where: {
        id,
        userId: decoded.userId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reminders: true,
        attachments: true,
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
            reminders: true,
            attachments: true
          }
        },
        section: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}