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
    const { tagIds } = body
    
    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 })
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

    // Verify all tags belong to the user
    if (tagIds.length > 0) {
      const userTags = await db.tag.findMany({
        where: {
          id: { in: tagIds },
          userId: decoded.userId
        }
      })

      if (userTags.length !== tagIds.length) {
        return NextResponse.json({ error: "One or more tags not found" }, { status: 404 })
      }
    }

    // Delete existing task tags
    await db.taskTag.deleteMany({
      where: {
        taskId
      }
    })

    // Create new task tags
    if (tagIds.length > 0) {
      await db.taskTag.createMany({
        data: tagIds.map((tagId: string) => ({
          taskId,
          tagId
        }))
      })
    }

    // Return updated task with tags
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
    console.error("Error updating task tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}