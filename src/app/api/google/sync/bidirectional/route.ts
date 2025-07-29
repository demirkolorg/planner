import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { syncTaskToCalendar, createCalendarClient, refreshAccessToken, convertCalendarEventToTask } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    // JWT token'dan user ID al
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Google Calendar entegrasyonu kontrol et
    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId }
    })

    if (!integration || !integration.syncEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı veya deaktif'
      }, { status: 400 })
    }

    // Access token'ı yenile (gerekirse)
    let accessToken = integration.accessToken
    if (integration.refreshToken) {
      const refreshedToken = await refreshAccessToken(integration.refreshToken)
      if (refreshedToken) {
        accessToken = refreshedToken
        await db.googleCalendarIntegration.update({
          where: { userId },
          data: { accessToken: refreshedToken }
        })
      }
    }

    const results = {
      tasksToCalendar: { total: 0, synced: 0, failed: 0, errors: [] as string[] },
      calendarToTasks: { total: 0, synced: 0, failed: 0, errors: [] as string[] }
    }

    // 1. PLANNER → CALENDAR SYNC (Mevcut sync)
    const tasks = await db.task.findMany({
      where: {
        userId,
        completed: false
      },
      include: {
        project: true,
        section: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    results.tasksToCalendar.total = tasks.length

    for (const task of tasks) {
      try {
        const existingEvent = await db.taskCalendarEvent.findUnique({
          where: { taskId: task.id }
        })

        const action = existingEvent ? 'UPDATE' : 'CREATE'
        const syncResult = await syncTaskToCalendar(userId, task, action)

        if (syncResult.success) {
          results.tasksToCalendar.synced++
        } else {
          results.tasksToCalendar.failed++
          results.tasksToCalendar.errors.push(`${task.title}: ${syncResult.error}`)
        }
      } catch (error) {
        results.tasksToCalendar.failed++
        results.tasksToCalendar.errors.push(`${task.title}: Beklenmeyen hata`)
      }
    }

    // 2. CALENDAR → PLANNER SYNC (Yeni özellik)
    const calendar = createCalendarClient(accessToken)
    
    // Seçili takvimlerden event'leri al
    const selectedCalendarIds = integration.calendarIds || [integration.calendarId || 'primary']
    let allEvents: any[] = []
    
    // Son 7 gün içindeki eventleri al (tüm seçili takvimlerden)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    for (const calendarId of selectedCalendarIds) {
      try {
        const eventsResponse = await calendar.events.list({
          calendarId,
          timeMin: sevenDaysAgo,
          singleEvents: true,
          orderBy: 'updated'
        })
        
        const calendarEvents = eventsResponse.data.items || []
        // Her event'e hangi takvimden geldiğini işaretle
        calendarEvents.forEach(event => {
          event._sourceCalendarId = calendarId
        })
        
        allEvents = allEvents.concat(calendarEvents)
      } catch (error) {
        console.error(`Error fetching events from calendar ${calendarId}:`, error)
        results.calendarToTasks.errors.push(`Takvim ${calendarId} event'leri alınamadı`)
      }
    }

    const events = allEvents
    results.calendarToTasks.total = events.length

    for (const event of events) {
      try {
        // Bu event zaten sync edilmiş bir task'a ait mi?
        const existingTaskEvent = await db.taskCalendarEvent.findUnique({
          where: { googleEventId: event.id },
          include: { task: true }
        })

        if (existingTaskEvent) {
          // Mevcut task'ı güncelle
          const eventData = convertCalendarEventToTask(event)
          
          // Event silinmiş mi?
          if (event.status === 'cancelled') {
            await db.task.delete({
              where: { id: existingTaskEvent.task.id }
            })
            results.calendarToTasks.synced++
          } else {
            // Task'ı güncelle
            await db.task.update({
              where: { id: existingTaskEvent.task.id },
              data: {
                title: eventData.title,
                description: eventData.description,
                priority: eventData.priority,
                dueDate: eventData.dueDate ? new Date(eventData.dueDate) : null,
              }
            })

            // All-day event güncellemesi log
            if (eventData.isAllDay) {
              console.log(`All-day event updated task: ${eventData.title} (${eventData.originalEventType})`)
            }

            results.calendarToTasks.synced++
          }
        } else {
          // Yeni task oluştur
          const eventData = convertCalendarEventToTask(event)
          
          // "Gelen Kutusu" projesini bul veya oluştur
          let inboxProject = await db.project.findFirst({
            where: { 
              userId,
              name: 'Gelen Kutusu'
            }
          })

          if (!inboxProject) {
            // Gelen Kutusu projesi yoksa oluştur
            inboxProject = await db.project.create({
              data: {
                name: 'Gelen Kutusu',
                emoji: '📥',
                userId
              }
            })
          }

          // Varsayılan section'ı bul veya oluştur
          let defaultSection = await db.section.findFirst({
            where: { projectId: inboxProject.id }
          })

          if (!defaultSection) {
            defaultSection = await db.section.create({
              data: {
                name: 'Genel',
                projectId: inboxProject.id,
                order: 0
              }
            })
          }

          // Yeni task oluştur
          const newTask = await db.task.create({
            data: {
              title: eventData.title,
              description: eventData.description,
              priority: eventData.priority,
              dueDate: eventData.dueDate ? new Date(eventData.dueDate) : null,
              userId,
              projectId: inboxProject.id,
              sectionId: defaultSection.id,
            }
          })

          // isAllDay bilgisini task'a ekle (geçici olarak description'da saklayabiliriz)
          if (eventData.isAllDay) {
            console.log(`All-day event converted to task: ${newTask.title} (${eventData.originalEventType})`)
          }

          // TaskCalendarEvent kaydı oluştur
          await db.taskCalendarEvent.create({
            data: {
              taskId: newTask.id,
              googleEventId: event.id,
              calendarId: event._sourceCalendarId || selectedCalendarIds[0],
              syncStatus: 'SYNCED',
              lastSyncAt: new Date(),
            }
          })

          results.calendarToTasks.synced++
        }
      } catch (error) {
        results.calendarToTasks.failed++
        results.calendarToTasks.errors.push(`Event ${event.summary}: Beklenmeyen hata`)
      }
    }

    // Integration'ın son sync zamanını güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: { lastSyncAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'İki yönlü senkronizasyon tamamlandı',
      results
    })

  } catch (error) {
    console.error('İki yönlü sync hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Senkronizasyon başarısız' },
      { status: 500 }
    )
  }
}