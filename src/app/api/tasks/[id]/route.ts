import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createTaskActivity, TaskActivityTypes, getActivityDescription, getPriorityDisplayName } from "@/lib/task-activity"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { syncTaskToCalendar } from "@/lib/google-calendar"
import { createTaskStatusChangeNotification } from "@/lib/notification-utils"

// Öncelik mapping - İngilizce değerler doğrudan kullanılabilir
const VALID_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"]

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
      },
      include: {
        project: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Priority validation uygula eğer priority güncellenmişse
    const updateData = { ...body }
    if (updateData.priority && !VALID_PRIORITIES.includes(updateData.priority)) {
      updateData.priority = "NONE"
    }

    // Değişiklikleri tespit et ve aktivite logları oluştur
    const changes: Array<{type: any, oldValue?: string, newValue?: string}> = []

    // Title değişikliği
    if (updateData.title && updateData.title !== existingTask.title) {
      changes.push({
        type: TaskActivityTypes.TITLE_CHANGED,
        oldValue: existingTask.title,
        newValue: updateData.title
      })
    }

    // Description değişikliği
    if (updateData.description !== undefined && updateData.description !== existingTask.description) {
      changes.push({
        type: TaskActivityTypes.DESCRIPTION_CHANGED,
        oldValue: existingTask.description || '',
        newValue: updateData.description || ''
      })
    }

    // Completion durumu değişikliği
    if (updateData.completed !== undefined && updateData.completed !== existingTask.completed) {
      changes.push({
        type: updateData.completed ? TaskActivityTypes.COMPLETED : TaskActivityTypes.UNCOMPLETED
      })
    }

    // Öncelik değişikliği
    if (updateData.priority && updateData.priority !== existingTask.priority) {
      changes.push({
        type: TaskActivityTypes.PRIORITY_CHANGED,
        oldValue: getPriorityDisplayName(existingTask.priority),
        newValue: getPriorityDisplayName(updateData.priority)
      })
    }

    // Due date değişikliği
    if (updateData.dueDate !== undefined) {
      const oldDate = existingTask.dueDate ? new Date(existingTask.dueDate).toLocaleDateString('tr-TR') : null
      const newDate = updateData.dueDate ? new Date(updateData.dueDate).toLocaleDateString('tr-TR') : null
      
      if (oldDate !== newDate) {
        changes.push({
          type: TaskActivityTypes.DUE_DATE_CHANGED,
          oldValue: oldDate,
          newValue: newDate
        })
      }
    }

    // Pin durumu değişikliği
    if (updateData.isPinned !== undefined && updateData.isPinned !== existingTask.isPinned) {
      changes.push({
        type: updateData.isPinned ? TaskActivityTypes.PINNED : TaskActivityTypes.UNPINNED
      })
    }

    // Genel güncelleme (eğer başka değişiklikler varsa)
    if (Object.keys(updateData).some(key => 
      !['completed', 'priority', 'dueDate', 'isPinned', 'title', 'description'].includes(key) && 
      updateData[key] !== existingTask[key as keyof typeof existingTask]
    )) {
      changes.push({
        type: TaskActivityTypes.UPDATED
      })
    }

    // Update task
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
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
            }
          }
        },
        section: true
      }
    })

    // Aktivite loglarını oluştur
    for (const change of changes) {
      await createTaskActivity({
        taskId: id,
        userId: decoded.userId,
        actionType: change.type,
        oldValue: change.oldValue,
        newValue: change.newValue,
        description: getActivityDescription(change.type, change.oldValue, change.newValue)
      })

      // Görev durumu değişikliği bildirimi (tamamlanma/açma)
      if (change.type === TaskActivityTypes.COMPLETED || change.type === TaskActivityTypes.UNCOMPLETED) {
        try {
          // Atanmış kullanıcıları bul
          const assignments = await db.assignment.findMany({
            where: {
              targetType: 'TASK',
              targetId: id,
              status: 'ACTIVE'
            },
            include: {
              user: {
                select: {
                  id: true
                }
              }
            }
          })

          // Her atanmış kullanıcıya bildirim gönder
          for (const assignment of assignments) {
            if (assignment.userId && assignment.userId !== decoded.userId) {
              await createTaskStatusChangeNotification(
                id,
                assignment.userId,
                decoded.userId,
                existingTask.title,
                change.type === TaskActivityTypes.COMPLETED
              )
            }
          }
        } catch (notificationError) {
          console.error('Task status change notification error:', notificationError)
          // Bildirim hatası ana işlemi etkilememelidir
        }
      }

      // Proje aktivitesi kaydet (sadece completion/uncompletion için ve projeye bağlı görevler için)
      if (existingTask.project?.id) {
        if (change.type === TaskActivityTypes.COMPLETED) {
          await createProjectActivity({
            projectId: existingTask.project.id,
            userId: decoded.userId,
            actionType: ProjectActivityTypes.TASK_COMPLETED,
            entityType: "task",
            entityId: id,
            entityName: existingTask.title,
            description: `Görev tamamlandı: "${existingTask.title}"`
          })
        } else if (change.type === TaskActivityTypes.UNCOMPLETED) {
          await createProjectActivity({
            projectId: existingTask.project.id,
            userId: decoded.userId,
            actionType: ProjectActivityTypes.TASK_UNCOMPLETED,
            entityType: "task",
            entityId: id,
            entityName: existingTask.title,
            description: `Görev tamamlanması geri alındı: "${existingTask.title}"`
          })
        }
      }
    }

    // Google Calendar'a sync et (eğer önemli değişiklikler varsa)
    const shouldSync = changes.some(change => 
      [TaskActivityTypes.TITLE_CHANGED, TaskActivityTypes.DESCRIPTION_CHANGED, 
       TaskActivityTypes.PRIORITY_CHANGED, TaskActivityTypes.DUE_DATE_CHANGED].includes(change.type)
    )
    
    if (shouldSync) {
      syncTaskToCalendar(decoded.userId, updatedTask, 'UPDATE').catch(error => {
        console.error('Calendar sync hatası (task güncelleme):', error)
      })
    }

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
      },
      include: {
        project: true
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Delete task (this will also delete sub-tasks due to cascade)
    await db.task.delete({
      where: { id }
    })

    // Aktivite kaydetmeyi silme işleminden sonra yap (task silindiği için hata verebilir ama önemli değil)
    Promise.allSettled([
      createTaskActivity({
        taskId: id,
        userId: decoded.userId,
        actionType: TaskActivityTypes.DELETED,
        description: getActivityDescription(TaskActivityTypes.DELETED)
      }),
      existingTask.project?.id ? createProjectActivity({
        projectId: existingTask.project.id,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.TASK_DELETED,
        entityType: "task",
        entityId: id,
        entityName: existingTask.title,
        description: `Görev silindi: "${existingTask.title}"`
      }) : Promise.resolve()
    ]).catch(error => {
      console.error('Activity logging error (non-blocking):', error)
    })

    // Google Calendar'dan sync et
    syncTaskToCalendar(decoded.userId, existingTask, 'DELETE').catch(error => {
      console.error('Calendar sync hatası (task silme):', error)
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
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
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