import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCalendarClient, convertCalendarEventToTask, refreshAccessToken } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    // Google Calendar webhook'tan gelen header'ları kontrol et
    const channelId = request.headers.get('x-goog-channel-id')
    const resourceId = request.headers.get('x-goog-resource-id')
    const resourceState = request.headers.get('x-goog-resource-state')

    console.log('Webhook alındı:', { channelId, resourceId, resourceState })

    // Webhook doğrulama
    if (!channelId || !resourceId) {
      return NextResponse.json({ error: 'Invalid webhook headers' }, { status: 400 })
    }

    // Sadece değişiklikleri işle (sync veya exists durumlarını)
    if (resourceState !== 'sync' && resourceState !== 'exists') {
      return NextResponse.json({ success: true, message: 'Ignored' })
    }

    // Channel ID'den hangi kullanıcının calendar'ı olduğunu bul
    // Bu bilgiyi webhook kurulumunda bir yerde saklamamız gerekecek
    // Şimdilik tüm aktif entegrasyonları kontrol edelim
    const integrations = await db.googleCalendarIntegration.findMany({
      where: { syncEnabled: true }
    })

    for (const integration of integrations) {
      try {
        // Access token'ı yenile (gerekirse)
        let accessToken = integration.accessToken
        if (integration.refreshToken) {
          const refreshedToken = await refreshAccessToken(integration.refreshToken)
          if (refreshedToken) {
            accessToken = refreshedToken
            await db.googleCalendarIntegration.update({
              where: { userId: integration.userId },
              data: { accessToken: refreshedToken }
            })
          }
        }

        // Son değişiklikleri al
        await processCalendarChanges(integration.userId, accessToken, integration.calendarId)
      } catch (error) {
        console.error(`Kullanıcı ${integration.userId} için webhook işleme hatası:`, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook işleme hatası:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Webhook doğrulama için GET endpoint
export async function GET(request: NextRequest) {
  // Google Calendar webhook verification
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  if (challenge) {
    return new NextResponse(challenge)
  }
  
  return NextResponse.json({ status: 'Webhook endpoint active' })
}

// Calendar değişikliklerini işle
async function processCalendarChanges(userId: string, accessToken: string, calendarId: string) {
  try {
    const calendar = createCalendarClient(accessToken)
    
    // Son 1 saat içindeki değişiklikleri al
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const response = await calendar.events.list({
      calendarId,
      updatedMin: oneHourAgo,
      singleEvents: true,
      orderBy: 'updated'
    })

    const events = response.data.items || []

    for (const event of events) {
      await processSingleEvent(userId, event, calendarId)
    }
  } catch (error) {
    console.error('Calendar değişiklikleri işleme hatası:', error)
  }
}

// Tek bir event'i işle
async function processSingleEvent(userId: string, event: any, calendarId: string) {
  try {
    // Bu event bizim oluşturduğumuz bir task'a ait mi kontrol et
    const existingTaskEvent = await db.taskCalendarEvent.findUnique({
      where: { googleEventId: event.id },
      include: { task: true }
    })

    if (!existingTaskEvent) {
      // Bu bizim event'imiz değil, yeni task oluştur
      await createTaskFromEvent(userId, event, calendarId)
    } else {
      // Mevcut task'ı güncelle
      await updateTaskFromEvent(existingTaskEvent.task, event)
    }
  } catch (error) {
    console.error('Event işleme hatası:', error)
  }
}

// Calendar event'ten yeni task oluştur
async function createTaskFromEvent(userId: string, event: any, calendarId: string) {
  try {
    // Event'i task formatına çevir
    const taskData = convertCalendarEventToTask(event)
    
    // Kullanıcının varsayılan projesini bul
    const defaultProject = await db.project.findFirst({
      where: { 
        userId,
        name: 'Gelen Kutusu' // Varsayılan proje
      }
    })

    if (!defaultProject) return

    // Varsayılan section'ı bul
    const defaultSection = await db.section.findFirst({
      where: { projectId: defaultProject.id }
    })

    if (!defaultSection) return

    // Task oluştur
    const task = await db.task.create({
      data: {
        ...taskData,
        userId,
        projectId: defaultProject.id,
        sectionId: defaultSection.id,
      }
    })

    // TaskCalendarEvent kaydı oluştur
    await db.taskCalendarEvent.create({
      data: {
        taskId: task.id,
        googleEventId: event.id,
        calendarId,
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      }
    })

    console.log(`Calendar'dan yeni task oluşturuldu: ${task.title}`)
  } catch (error) {
    console.error('Calendar event\'ten task oluşturma hatası:', error)
  }
}

// Calendar event'ten task güncelle  
async function updateTaskFromEvent(task: any, event: any) {
  try {
    const updatedTaskData = convertCalendarEventToTask(event)
    
    // Event silinmiş mi kontrol et
    if (event.status === 'cancelled') {
      // Task'ı sil
      await db.task.delete({
        where: { id: task.id }
      })
      console.log(`Calendar'dan silinen event nedeniyle task silindi: ${task.title}`)
      return
    }

    // Task'ı güncelle
    await db.task.update({
      where: { id: task.id },
      data: {
        title: updatedTaskData.title,
        description: updatedTaskData.description,
        priority: updatedTaskData.priority,
        dueDate: updatedTaskData.dueDate ? new Date(updatedTaskData.dueDate) : null,
      }
    })

    // Sync durumunu güncelle
    await db.taskCalendarEvent.update({
      where: { taskId: task.id },
      data: {
        syncStatus: 'SYNCED',
        lastSyncAt: new Date(),
      }
    })

    console.log(`Calendar'dan task güncellendi: ${updatedTaskData.title}`)
  } catch (error) {
    console.error('Calendar event\'ten task güncelleme hatası:', error)
  }
}