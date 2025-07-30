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

    // 1. PLANNER → PLANNER CALENDAR SYNC (Sadece Planner Takvimi'ne yaz)
    // Önce Planner Takvimi'nin mevcut olduğundan emin ol
    if (!integration.plannerCalendarCreated || !integration.plannerCalendarId) {
      // Planner Takvimi yoksa oluştur
      const { createPlannerCalendar } = await import('@/lib/google-calendar')
      const plannerCalendarId = await createPlannerCalendar(accessToken)
      
      if (plannerCalendarId) {
        await db.googleCalendarIntegration.update({
          where: { userId },
          data: {
            plannerCalendarId,
            plannerCalendarCreated: true
          }
        })
        integration.plannerCalendarId = plannerCalendarId
        integration.plannerCalendarCreated = true
        console.log(`✅ Planner Takvimi otomatik oluşturuldu: ${plannerCalendarId}`)
      } else {
        results.tasksToCalendar.errors.push('Planner Takvimi oluşturulamadı - Google Calendar yetkilendirmesi yenilenmeli')
        console.log('⚠️ Planner Takvimi oluşturulamadı - scope yetkilendirmesi eksik olabilir')
      }
    }

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

    // 2. READ-ONLY CALENDARS → PLANNER SYNC (Sadece okunacak takvimlerden)
    const calendar = createCalendarClient(accessToken)
    
    // Sadece readOnly takvimlerden event'leri al (Planner Takvimi hariç)
    const readOnlyCalendarIds = integration.readOnlyCalendarIds || []
    let allEvents: any[] = []
    
    if (readOnlyCalendarIds.length === 0) {
      console.log('📋 Hiç okunacak takvim seçilmemiş, Calendar → Planner sync atlanıyor')
      results.calendarToTasks.total = 0
    } else {
      // Incremental sync: Son sync zamanından itibaren al (performans için)
      const lastSyncTime = integration.lastSyncAt 
        ? new Date(integration.lastSyncAt.getTime() - 5 * 60 * 1000) // 5 dakika buffer
        : new Date(Date.now() - 24 * 60 * 60 * 1000) // Varsayılan: 1 gün önce
      
      for (const calendarId of readOnlyCalendarIds) {
        // Planner Takvimi'ni atla (double check)
        if (calendarId === integration.plannerCalendarId) {
          console.log(`⚠️ Planner Takvimi (${calendarId}) readOnly listesinde, atlanıyor`)
          continue
        }
        
        try {
          const eventsResponse = await calendar.events.list({
            calendarId,
            timeMin: lastSyncTime.toISOString(),
            singleEvents: true,
            orderBy: 'updated',
            maxResults: 100 // Arttırıldı çünkü incremental sync kullanıyoruz
          })
          
          const calendarEvents = eventsResponse.data.items || []
          // Her event'e hangi takvimden geldiğini işaretle
          calendarEvents.forEach(event => {
            event._sourceCalendarId = calendarId
          })
          
          allEvents = allEvents.concat(calendarEvents)
          console.log(`📅 ${calendarId} takviminden ${calendarEvents.length} event alındı`)
        } catch (error) {
          console.error(`Error fetching events from calendar ${calendarId}:`, error)
          results.calendarToTasks.errors.push(`Takvim ${calendarId} event'leri alınamadı`)
        }
      }
    }

    const events = allEvents
    results.calendarToTasks.total = events.length

    if (events.length > 0) {
      // Batch database operations - tüm event ID'lerini bir seferde sorgula
      const eventIds = events.map(event => event.id)
      const existingTaskEvents = await db.taskCalendarEvent.findMany({
        where: { 
          googleEventId: { in: eventIds }
        },
        include: { task: true }
      })

      // ID'ye göre hızlı erişim için Map oluştur
      const existingEventsMap = new Map()
      existingTaskEvents.forEach(taskEvent => {
        existingEventsMap.set(taskEvent.googleEventId, taskEvent)
      })

      // Gelen Kutusu projesi ve section'ı önceden al
      let inboxProject = await db.project.findFirst({
        where: { 
          userId,
          name: 'Gelen Kutusu'
        }
      })

      if (!inboxProject) {
        inboxProject = await db.project.create({
          data: {
            name: 'Gelen Kutusu',
            emoji: '📥',
            userId
          }
        })
      }

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

      // Batch operations için arrays
      const tasksToUpdate: any[] = []
      const tasksToCreate: any[] = []
      const taskEventsToCreate: any[] = []
      const tasksToDelete: string[] = []

      // Event'leri işle ve batch operations'a hazırla
      for (const event of events) {
        try {
          const existingTaskEvent = existingEventsMap.get(event.id)
          const eventData = convertCalendarEventToTask(event)

          if (existingTaskEvent) {
            // Mevcut task güncelleme veya silme
            if (event.status === 'cancelled') {
              tasksToDelete.push(existingTaskEvent.task.id)
            } else {
              tasksToUpdate.push({
                id: existingTaskEvent.task.id,
                data: {
                  title: eventData.title,
                  description: eventData.description,
                  priority: eventData.priority,
                  dueDate: eventData.dueDate ? new Date(eventData.dueDate) : null,
                }
              })
            }
          } else {
            // Yeni task oluşturma
            if (event.status !== 'cancelled') {
              const taskId = `temp_${Date.now()}_${Math.random()}`
              tasksToCreate.push({
                tempId: taskId,
                data: {
                  title: eventData.title,
                  description: eventData.description,
                  priority: eventData.priority,
                  dueDate: eventData.dueDate ? new Date(eventData.dueDate) : null,
                  userId,
                  projectId: inboxProject.id,
                  sectionId: defaultSection.id,
                },
                eventId: event.id,
                calendarId: event._sourceCalendarId || readOnlyCalendarIds[0]
              })
            }
          }
        } catch (error) {
          results.calendarToTasks.failed++
          results.calendarToTasks.errors.push(`Event ${event.summary}: Veri hazırlama hatası`)
        }
      }

      // Batch operations'ı çalıştır
      try {
        // 1. Task güncellemeleri
        for (const taskUpdate of tasksToUpdate) {
          await db.task.update({
            where: { id: taskUpdate.id },
            data: taskUpdate.data
          })
          results.calendarToTasks.synced++
        }

        // 2. Task silmeleri
        if (tasksToDelete.length > 0) {
          await db.task.deleteMany({
            where: { id: { in: tasksToDelete } }
          })
          results.calendarToTasks.synced += tasksToDelete.length
        }

        // 3. Yeni task'lar oluştur
        for (const taskToCreate of tasksToCreate) {
          const newTask = await db.task.create({
            data: taskToCreate.data
          })

          // TaskCalendarEvent kaydı oluştur
          await db.taskCalendarEvent.create({
            data: {
              taskId: newTask.id,
              googleEventId: taskToCreate.eventId,
              calendarId: taskToCreate.calendarId,
              syncStatus: 'SYNCED',
              lastSyncAt: new Date(),
            }
          })
          
          results.calendarToTasks.synced++
        }

        console.log(`📊 Calendar->Planner Sync Stats: ${tasksToUpdate.length} updated, ${tasksToDelete.length} deleted, ${tasksToCreate.length} created`)
        
      } catch (error) {
        console.error('Batch operations error:', error)
        results.calendarToTasks.failed += events.length
        results.calendarToTasks.errors.push('Batch operations başarısız')
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