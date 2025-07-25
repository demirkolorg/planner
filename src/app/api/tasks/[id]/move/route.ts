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
    const { id } = await params
    const { targetProjectId, targetSectionId } = await request.json()
    
    // Taşınacak görevi kontrol et (current project ve section bilgileriyle)
    const taskToMove = await db.task.findFirst({
      where: {
        id,
        userId: decoded.userId
      },
      include: {
        project: true,
        section: true
      }
    })

    if (!taskToMove) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Hedef projenin kullanıcıya ait olduğunu kontrol et
    const targetProject = await db.project.findFirst({
      where: {
        id: targetProjectId,
        userId: decoded.userId
      }
    })

    if (!targetProject) {
      return NextResponse.json({ error: "Target project not found" }, { status: 404 })
    }

    // Eğer bölüm ID'si verilmişse, o bölümün de hedef projeye ait olduğunu kontrol et
    if (targetSectionId) {
      const targetSection = await db.section.findFirst({
        where: {
          id: targetSectionId,
          projectId: targetProjectId
        }
      })

      if (!targetSection) {
        return NextResponse.json({ error: "Target section not found" }, { status: 404 })
      }
    }

    // Alt görevleri getir
    const subTasks = await db.task.findMany({
      where: {
        parentTaskId: id,
        userId: decoded.userId
      }
    })

    // Transaction içinde ana görev ve tüm alt görevleri taşı
    const updatedTasks = await db.$transaction(async (tx) => {
      // Ana görevi taşı
      const updatedMainTask = await tx.task.update({
        where: { id },
        data: {
          projectId: targetProjectId,
          sectionId: targetSectionId || null,
          updatedAt: new Date()
        },
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
              reminders: true
            }
          },
          section: true
        }
      })

      // Tüm alt görevleri de aynı hedefe taşı
      if (subTasks.length > 0) {
        await tx.task.updateMany({
          where: {
            parentTaskId: id,
            userId: decoded.userId
          },
          data: {
            projectId: targetProjectId,
            sectionId: targetSectionId || null,
            updatedAt: new Date()
          }
        })
      }

      return updatedMainTask
    })

    // Taşıma aktivitesi kaydet
    const fromLocation = `${taskToMove.project.name}${taskToMove.section ? ` - ${taskToMove.section.name}` : ''}`
    const toLocation = `${targetProject.name}${targetSectionId ? ` - ${(await db.section.findUnique({ where: { id: targetSectionId } }))?.name || ''}` : ''}`
    
    await createTaskActivity({
      taskId: id,
      userId: decoded.userId,
      actionType: TaskActivityTypes.MOVED,
      oldValue: fromLocation,
      newValue: toLocation,
      description: getActivityDescription(TaskActivityTypes.MOVED, fromLocation, toLocation)
    })

    return NextResponse.json(updatedTasks)
  } catch (error) {
    console.error("Error moving task:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}