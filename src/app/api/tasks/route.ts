import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createTaskActivity, TaskActivityTypes, getActivityDescription } from "@/lib/task-activity"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"

// Öncelik mapping (Türkçe → İngilizce)
const PRIORITY_MAP: Record<string, string> = {
  "Kritik": "CRITICAL",
  "Yüksek": "HIGH", 
  "Orta": "MEDIUM",
  "Düşük": "LOW",
  "Yok": "NONE"
}

interface CreateTaskRequest {
  title: string
  description?: string
  projectId: string
  sectionId: string
  priority?: string
  dueDate?: string  // ISO date string
  tags?: string[]  // Tag name'leri
  parentTaskId?: string  // Alt görev için parent task ID'si
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body: CreateTaskRequest = await request.json()
    
    const { 
      title, 
      description, 
      projectId, 
      sectionId, 
      priority = "Yok",
      dueDate,
      tags = [],
      parentTaskId
    } = body

    if (!title || !projectId || !sectionId) {
      return NextResponse.json({ 
        error: "Title, projectId and sectionId are required" 
      }, { status: 400 })
    }

    // Proje kullanıcıya ait mi kontrol et
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: decoded.userId
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Bölüm mevcut mu kontrol et
    let finalSectionId = sectionId
    
    // Eğer 'default' section kullanılıyorsa, projenin ilk section'ını bul veya oluştur
    if (sectionId === 'default') {
      let defaultSection = await db.section.findFirst({
        where: {
          projectId: projectId
        },
        orderBy: {
          createdAt: 'asc'
        }
      })
      
      // Eğer proje hiç section'a sahip değilse, default section oluştur
      if (!defaultSection) {
        defaultSection = await db.section.create({
          data: {
            name: 'Varsayılan',
            projectId: projectId,
            order: 0
          }
        })
      }
      
      finalSectionId = defaultSection.id
    } else {
      // Normal section kontrolü
      const section = await db.section.findFirst({
        where: {
          id: sectionId,
          projectId: projectId
        }
      })

      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 })
      }
    }

    // Due date oluştur (ISO string'den)
    let parsedDueDate: Date | undefined
    if (dueDate) {
      try {
        parsedDueDate = new Date(dueDate)
        // Check if date is valid
        if (isNaN(parsedDueDate.getTime())) {
          parsedDueDate = undefined
        }
      } catch (error) {
        parsedDueDate = undefined
      }
    }

    // Transaction ile task ve tag ilişkilerini oluştur
    const result = await db.$transaction(async (tx) => {
      // Task oluştur
      const task = await tx.task.create({
        data: {
          title,
          description,
          priority: PRIORITY_MAP[priority] || "NONE",
          dueDate: parsedDueDate,
          projectId,
          sectionId: finalSectionId,
          userId: decoded.userId,
          parentTaskId
        }
      })

      // Tag ilişkilerini oluştur
      if (tags.length > 0) {
        // Önce mevcut tag'leri bul
        const existingTags = await tx.tag.findMany({
          where: {
            name: { in: tags },
            userId: decoded.userId
          }
        })
        
        // Eksik olan tag'leri tespit et
        const existingTagNames = existingTags.map(tag => tag.name)
        const missingTagNames = tags.filter(tagName => !existingTagNames.includes(tagName))
        
        // Rastgele renkler
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316']
        
        // Eksik tag'leri oluştur
        const newTags = []
        for (const tagName of missingTagNames) {
          const randomColor = colors[Math.floor(Math.random() * colors.length)]
          const newTag = await tx.tag.create({
            data: {
              name: tagName,
              color: randomColor,
              userId: decoded.userId
            }
          })
          newTags.push(newTag)
        }
        
        // Tüm tag'leri birleştir
        const allTags = [...existingTags, ...newTags]
        
        // TaskTag ilişkilerini oluştur
        const taskTagData = allTags.map(tag => ({
          taskId: task.id,
          tagId: tag.id
        }))

        if (taskTagData.length > 0) {
          await tx.taskTag.createMany({
            data: taskTagData
          })
        }
      }


      // Task'ı ilişkili verilerle birlikte döndür
      const result = await tx.task.findUnique({
        where: { id: task.id },
        include: {
          project: true,
          section: true,
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
          }
        }
      })

      return result
    })

    // Transaction başarılı olduktan sonra aktivite kaydet
    if (result) {
      await createTaskActivity({
        taskId: result.id,
        userId: decoded.userId,
        actionType: TaskActivityTypes.CREATED,
        description: getActivityDescription(TaskActivityTypes.CREATED)
      })

      // Eğer bu bir alt görev ise, parent task'a da aktivite kaydet
      if (parentTaskId) {
        await createTaskActivity({
          taskId: parentTaskId,
          userId: decoded.userId,
          actionType: TaskActivityTypes.SUBTASK_ADDED,
          newValue: result.title,
          description: getActivityDescription(TaskActivityTypes.SUBTASK_ADDED, null, result.title)
        })
      }

      // Proje aktivitesi kaydet
      await createProjectActivity({
        projectId: result.projectId,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.TASK_CREATED,
        entityType: "task",
        entityId: result.id,
        entityName: result.title,
        description: `Görev oluşturuldu: "${result.title}"`
      })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Kullanıcının tüm görevlerini getir
    const tasks = await db.task.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        project: true,
        section: true,
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
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}