import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Request body'den hedef proje ve bölüm bilgilerini al
    const body = await request.json().catch(() => ({}))
    const { targetProjectId, targetSectionId } = body
    
    // Kopyalanacak görevi tüm ilişkili verilerle birlikte getir
    const originalTask = await db.task.findFirst({
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
        reminders: true
      }
    })

    if (!originalTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Alt görevleri ayrıca getir
    const subTasks = await db.task.findMany({
      where: {
        parentTaskId: id,
        userId: decoded.userId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reminders: true
      }
    })

    // Transaction içinde kopyalama işlemini gerçekleştir
    const clonedTask = await db.$transaction(async (tx) => {
      // Ana görevi klonla
      const newTask = await tx.task.create({
        data: {
          title: originalTask.title,
          description: originalTask.description,
          completed: false, // Kopyalanan görev tamamlanmamış olarak başlasın
          priority: originalTask.priority,
          dueDate: originalTask.dueDate,
          isPinned: false, // Kopyalanan görev sabitlenmiş olmasın
          parentTaskId: originalTask.parentTaskId,
          projectId: targetProjectId || originalTask.projectId, // Hedef proje belirtilmişse onu kullan
          sectionId: targetSectionId !== undefined ? targetSectionId : originalTask.sectionId, // Hedef bölüm belirtilmişse onu kullan
          userId: decoded.userId
        }
      })

      // Etiketleri klonla
      if (originalTask.tags && originalTask.tags.length > 0) {
        await tx.taskTag.createMany({
          data: originalTask.tags.map(taskTag => ({
            taskId: newTask.id,
            tagId: taskTag.tagId
          }))
        })
      }

      // Hatırlatıcıları klonla
      if (originalTask.reminders && originalTask.reminders.length > 0) {
        await tx.reminder.createMany({
          data: originalTask.reminders.map(reminder => ({
            taskId: newTask.id,
            datetime: reminder.datetime,
            message: reminder.message,
            isActive: reminder.isActive
          }))
        })
      }

      // Alt görevleri recursively klonla
      if (subTasks && subTasks.length > 0) {
        for (const subTask of subTasks) {
          const clonedSubTask = await tx.task.create({
            data: {
              title: subTask.title,
              description: subTask.description,
              completed: false,
              priority: subTask.priority,
              dueDate: subTask.dueDate,
              isPinned: false,
              parentTaskId: newTask.id, // Yeni ana görevin alt görevi olacak
              projectId: targetProjectId || subTask.projectId, // Hedef proje belirtilmişse onu kullan
              sectionId: targetSectionId !== undefined ? targetSectionId : subTask.sectionId, // Hedef bölüm belirtilmişse onu kullan
              userId: decoded.userId
            }
          })

          // Alt görev etiketlerini klonla
          if (subTask.tags && subTask.tags.length > 0) {
            await tx.taskTag.createMany({
              data: subTask.tags.map(taskTag => ({
                taskId: clonedSubTask.id,
                tagId: taskTag.tagId
              }))
            })
          }

          // Alt görev hatırlatıcılarını klonla
          if (subTask.reminders && subTask.reminders.length > 0) {
            await tx.reminder.createMany({
              data: subTask.reminders.map(reminder => ({
                taskId: clonedSubTask.id,
                datetime: reminder.datetime,
                message: reminder.message,
                isActive: reminder.isActive
              }))
            })
          }
        }
      }

      // Kopyalanan görevi tüm ilişkilerle birlikte getir
      return await tx.task.findUnique({
        where: { id: newTask.id },
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
    })

    return NextResponse.json(clonedTask)
  } catch (error) {
    console.error("Error cloning task:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}