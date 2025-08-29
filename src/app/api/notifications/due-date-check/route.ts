import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Güvenlik kontrolü - sadece authorized kaynaklardan çağrılabilir
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Due date check job başladı:', new Date().toISOString())

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const in3Days = new Date(now)
    in3Days.setDate(in3Days.getDate() + 3)
    in3Days.setHours(23, 59, 59, 999)

    const in7Days = new Date(now)
    in7Days.setDate(in7Days.getDate() + 7)
    in7Days.setHours(23, 59, 59, 999)

    // Vadesi yaklaşan görevleri bul
    const tasksDueSoon = await db.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { dueDate: { lte: tomorrow } }, // Yarın veya bugün vadesi dolan
              { dueDate: { lte: in3Days } },  // 3 gün içinde vadesi dolan
              { dueDate: { lte: in7Days } }   // 7 gün içinde vadesi dolan
            ]
          },
          { completed: false }, // Tamamlanmamış görevler
          { dueDate: { gte: now } } // Henüz vadesi geçmemiş
        ]
      },
      include: {
        project: {
          select: { name: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          where: { status: 'ACTIVE' }
        }
      }
    })

    const results = {
      total: tasksDueSoon.length,
      processed: 0,
      failed: 0,
      notifications: [] as any[],
      errors: [] as string[]
    }

    // Her görev için bildirim oluştur
    for (const task of tasksDueSoon) {
      try {
        const dueDate = new Date(task.dueDate!)
        const timeDiff = dueDate.getTime() - now.getTime()
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

        let notificationType = 'TASK_DUE_SOON'
        let title = ''
        let message = ''

        if (daysDiff <= 1) {
          title = `Görev Bugün Teslim!`
          message = `"${task.title}" görevi bugün teslim edilmeli.`
        } else if (daysDiff <= 3) {
          title = `Görev ${daysDiff} Gün İçinde Teslim!`
          message = `"${task.title}" görevi ${daysDiff} gün içinde teslim edilmeli.`
        } else if (daysDiff <= 7) {
          title = `Görev 1 Hafta İçinde Teslim!`
          message = `"${task.title}" görevi ${daysDiff} gün içinde teslim edilmeli.`
        }

        // Görev sahibi için bildirim oluştur
        const existingNotificationForOwner = await db.notification.findFirst({
          where: {
            userId: task.userId,
            type: notificationType,
            entityId: task.id,
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Son 24 saat
            }
          }
        })

        if (!existingNotificationForOwner) {
          const notification = await db.notification.create({
            data: {
              userId: task.userId,
              type: notificationType,
              title,
              message,
              entityType: 'task',
              entityId: task.id,
              actionUrl: `/tasks/${task.id}`,
              metadata: {
                taskTitle: task.title,
                projectName: task.project?.name,
                dueDate: task.dueDate,
                daysDiff
              }
            }
          })

          results.notifications.push(notification)
          results.processed++
        }

        // Atanmış kullanıcılar için de bildirimler oluştur
        for (const assignment of task.assignments) {
          if (assignment.user && assignment.userId !== task.userId) {
            const existingNotificationForAssignee = await db.notification.findFirst({
              where: {
                userId: assignment.userId,
                type: notificationType,
                entityId: task.id,
                createdAt: {
                  gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Son 24 saat
                }
              }
            })

            if (!existingNotificationForAssignee) {
              const assigneeNotification = await db.notification.create({
                data: {
                  userId: assignment.userId!,
                  type: notificationType,
                  title: `Size Atanan ${title}`,
                  message: `Size atanan "${task.title}" görevi ${daysDiff <= 1 ? 'bugün' : `${daysDiff} gün içinde`} teslim edilmeli.`,
                  entityType: 'task',
                  entityId: task.id,
                  actionUrl: `/tasks/${task.id}`,
                  metadata: {
                    taskTitle: task.title,
                    projectName: task.project?.name,
                    dueDate: task.dueDate,
                    daysDiff,
                    isAssigned: true
                  }
                }
              })

              results.notifications.push(assigneeNotification)
              results.processed++
            }
          }
        }

      } catch (error) {
        results.failed++
        results.errors.push(`Task ${task.id} (${task.title}): ${error instanceof Error ? error.message : 'Beklenmeyen hata'}`)
        console.error(`Task ${task.id} due date notification error:`, error)
      }
    }

    console.log('Due date check job tamamlandı:', results)

    return NextResponse.json({
      success: true,
      message: 'Due date check tamamlandı',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Due date check job hatası:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Due date check başarısız',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const in7Days = new Date(now)
    in7Days.setDate(in7Days.getDate() + 7)

    // Vadesi yaklaşan görev sayısı
    const dueSoonCount = await db.task.count({
      where: {
        AND: [
          { dueDate: { lte: in7Days, gte: now } },
          { completed: false }
        ]
      }
    })

    // Son 24 saatte oluşturulan due date bildirimler
    const recentNotifications = await db.notification.count({
      where: {
        type: 'TASK_DUE_SOON',
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      }
    })

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        tasksDueSoon: dueSoonCount,
        notificationsLast24h: recentNotifications
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}