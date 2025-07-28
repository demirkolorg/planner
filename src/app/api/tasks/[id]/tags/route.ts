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
    const { tagIds } = body
    
    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 })
    }

    // Check if task exists and belongs to user, with existing tags
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        userId: decoded.userId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
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

    // Mevcut ve yeni tag'leri karşılaştır
    const currentTagIds = existingTask.tags.map(t => t.tagId)
    const addedTagIds = tagIds.filter((tagId: string) => !currentTagIds.includes(tagId))
    const removedTagIds = currentTagIds.filter(tagId => !tagIds.includes(tagId))

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

    // Aktivite logları oluştur
    if (addedTagIds.length > 0 || removedTagIds.length > 0) {
      const allTags = await db.tag.findMany({
        where: {
          id: { in: [...addedTagIds, ...removedTagIds] },
          userId: decoded.userId
        }
      })

      // Eklenen etiketler için aktivite
      for (const tagId of addedTagIds) {
        const tag = allTags.find(t => t.id === tagId)
        if (tag) {
          await createTaskActivity({
            taskId,
            userId: decoded.userId,
            actionType: TaskActivityTypes.TAG_ADDED,
            newValue: tag.name,
            description: getActivityDescription(TaskActivityTypes.TAG_ADDED, null, tag.name)
          })
        }
      }

      // Kaldırılan etiketler için aktivite
      for (const tagId of removedTagIds) {
        const tag = allTags.find(t => t.id === tagId)
        if (tag) {
          await createTaskActivity({
            taskId,
            userId: decoded.userId,
            actionType: TaskActivityTypes.TAG_REMOVED,
            oldValue: tag.name,
            description: getActivityDescription(TaskActivityTypes.TAG_REMOVED, tag.name, null)
          })
        }
      }
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
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            },
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