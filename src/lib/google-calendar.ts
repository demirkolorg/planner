import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// Google Calendar API scopes
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar', // Tam takvim erişimi (events + calendar management)
  'https://www.googleapis.com/auth/userinfo.email'
]

// OAuth2 Client oluştur
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

// Google Calendar client oluştur
export function createCalendarClient(accessToken: string) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// Planner Takvimi oluştur
export async function createPlannerCalendar(accessToken: string): Promise<string | null> {
  try {
    const calendar = createCalendarClient(accessToken)
    
    const calendarResource = {
      summary: 'Planner Takvimi',
      description: 'Planner uygulamasından otomatik senkronize edilen görevler. Bu takvimi silmeyin.',
      timeZone: 'Europe/Istanbul',
      // Planner'a özgü renk (mavi)
      colorId: '1' // Blue
    }

    const response = await calendar.calendars.insert({
      requestBody: calendarResource
    })

    if (response.data.id) {
      console.log(`✅ Planner Takvimi oluşturuldu: ${response.data.id}`)
      return response.data.id
    }

    return null
  } catch (error) {
    console.error('Planner Takvimi oluşturma hatası:', error)
    return null
  }
}

// Planner Takvimi'nin var olup olmadığını kontrol et
export async function checkPlannerCalendarExists(accessToken: string, calendarId: string): Promise<boolean> {
  try {
    const calendar = createCalendarClient(accessToken)
    
    const response = await calendar.calendars.get({
      calendarId
    })

    return !!response.data
  } catch (error) {
    console.error('Planner Takvimi kontrol hatası:', error)
    return false
  }
}

// "Planner Takvimi" isminde takvim var mı kontrol et ve ID'sini döndür
export async function findPlannerCalendarByName(accessToken: string): Promise<string | null> {
  try {
    const calendar = createCalendarClient(accessToken)
    
    const calendarsResponse = await calendar.calendarList.list()
    const calendars = calendarsResponse.data.items || []
    
    // "Planner Takvimi" isminde takvim bul
    const plannerCalendar = calendars.find(cal => 
      cal.summary === 'Planner Takvimi' && 
      (cal.accessRole === 'owner' || cal.accessRole === 'writer')
    )
    
    if (plannerCalendar) {
      console.log(`✅ Mevcut Planner Takvimi bulundu: ${plannerCalendar.id}`)
      return plannerCalendar.id!
    }
    
    console.log('🔍 Planner Takvimi bulunamadı')
    return null
  } catch (error) {
    console.error('Planner Takvimi arama hatası:', error)
    return null
  }
}

// Task'ı Calendar Event'e dönüştür
export function convertTaskToCalendarEvent(task: any) {
  const startDate = task.dueDate ? new Date(task.dueDate) : new Date()
  
  // Priority'ye göre renk
  const colorId = getPriorityColor(task.priority)

  // Task'ın orijinal event tipini kontrol et (eğer calendar'dan geldiyse)
  const isAllDay = task.isAllDay || isTaskAllDay(task)

  if (isAllDay) {
    // All-day event olarak oluştur
    // UTC tarihini doğrudan kullan (timezone offset olmadan)
    let dateStr: string
    
    const dueDateString = task.dueDate instanceof Date 
      ? task.dueDate.toISOString()
      : task.dueDate.toString()
    
    if (dueDateString.includes('T00:00:00.000Z')) {
      // Zaten UTC formatındaysa, sadece tarih kısmını al
      dateStr = dueDateString.split('T')[0]
    } else {
      // Local date'i UTC'ye çevirmeden doğrudan tarihi al
      const localDate = new Date(task.dueDate)
      const year = localDate.getFullYear()
      const month = String(localDate.getMonth() + 1).padStart(2, '0')
      const day = String(localDate.getDate()).padStart(2, '0')
      dateStr = `${year}-${month}-${day}`
    }
    
    console.log('📅 convertTaskToCalendarEvent DEBUG:', {
      taskTitle: task.title,
      originalDueDate: task.dueDate,
      dueDateString,
      finalDateStr: dateStr,
      isAllDay: true
    })
    
    
    return {
      summary: task.title,
      description: task.description || '',
      start: {
        date: dateStr,
      },
      end: {
        date: dateStr,
      },
      colorId,
      reminders: {
        useDefault: false,
        overrides: getPriorityReminders(task.priority),
      },
    }
  } else {
    // Timed event olarak oluştur
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 saat ekle
    
    return {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Istanbul',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Istanbul',
      },
      colorId,
      reminders: {
        useDefault: false,
        overrides: getPriorityReminders(task.priority),
      },
    }
  }  
}

// Task'ın all-day olup olmadığını kontrol et
function isTaskAllDay(task: any): boolean {
  if (!task.dueDate) return true // Tarih yoksa all-day varsay
  
  // All-day event tespiti: UTC'de 00:00:00 ise all-day event'tir
  const dueDateString = task.dueDate instanceof Date 
    ? task.dueDate.toISOString()
    : task.dueDate.toString()
  
  // İlk kontrol: UTC format
  let isAllDayEvent = dueDateString.includes('T00:00:00.000Z')
  
  // Eğer UTC format değilse, manual kontrol yap (eski görevler için)
  if (!isAllDayEvent && task.dueDate instanceof Date) {
    const date = task.dueDate
    // UTC'de saatin 0 olup olmadığını kontrol et
    const utcHours = date.getUTCHours()
    const utcMinutes = date.getUTCMinutes()
    const utcSeconds = date.getUTCSeconds()
    
    isAllDayEvent = utcHours === 0 && utcMinutes === 0 && utcSeconds === 0
  }
  
  console.log('🔍 isTaskAllDay DEBUG:', {
    taskTitle: task.title,
    originalDueDate: task.dueDate,
    dueDateString,
    isAllDay: isAllDayEvent
  })
  
  return isAllDayEvent
}

// Priority'ye göre renk ID'si
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return '11' // Red
    case 'HIGH':
      return '6'  // Orange
    case 'MEDIUM':
      return '5'  // Yellow
    case 'LOW':
      return '2'  // Green
    default:
      return '1'  // Blue
  }
}

// Priority'ye göre hatırlatıcılar
function getPriorityReminders(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ]
    case 'HIGH':
      return [
        { method: 'popup', minutes: 30 },
      ]
    case 'MEDIUM':
      return [
        { method: 'popup', minutes: 15 },
      ]
    default:
      return [
        { method: 'popup', minutes: 10 },
      ]
  }
}

// Token yenileme
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token || null
  } catch (error) {
    console.error('Token yenileme hatası:', error)
    return null
  }
}

// Calendar Event'i Task'a dönüştür (ters işlem)
export function convertCalendarEventToTask(event: any) {
  // Event tipini tespit et (all-day vs timed)
  const isAllDay = !!event.start?.date && !event.start?.dateTime
  
  let dueDate: string | null = null
  
  if (isAllDay) {
    // All-day event: tarihi 00:00 saati ile kullan
    const dateStr = event.start.date
    dueDate = `${dateStr}T00:00:00.000Z`
  } else {
    // Timed event: exact zamanı kullan
    dueDate = event.start?.dateTime || null
  }

  const result = {
    title: event.summary || 'Başlıksız Görev',
    description: event.description || '',
    dueDate,
    priority: getColorPriority(event.colorId),
    isAllDay, // Event tipini sakla
    originalEventType: isAllDay ? 'all-day' : 'timed' // Debug için
  }
  
  return result
}

// Renk ID'sinden priority çıkar
function getColorPriority(colorId?: string): string {
  switch (colorId) {
    case '11':
      return 'CRITICAL'
    case '6':
      return 'HIGH'
    case '5':
      return 'MEDIUM'
    case '2':
      return 'LOW'
    default:
      return 'MEDIUM'
  }
}

// Google Calendar Event oluştur
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  task: any
): Promise<string | null> {
  try {
    const calendar = createCalendarClient(accessToken)
    const event = convertTaskToCalendarEvent(task)

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    })

    return response.data.id || null
  } catch (error) {
    console.error('Calendar event oluşturma hatası:', error)
    return null
  }
}

// Google Calendar Event güncelle
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  task: any
): Promise<boolean> {
  try {
    const calendar = createCalendarClient(accessToken)
    const event = convertTaskToCalendarEvent(task)

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    })

    return true
  } catch (error) {
    console.error('Calendar event güncelleme hatası:', error)
    return false
  }
}

// Google Calendar Event sil
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const calendar = createCalendarClient(accessToken)

    await calendar.events.delete({
      calendarId,
      eventId,
    })

    return true
  } catch (error) {
    console.error('Calendar event silme hatası:', error)
    return false
  }
}

// Task'ı Google Calendar ile senkronize et
export async function syncTaskToCalendar(
  userId: string,
  task: any,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    // Kullanıcının Google Calendar entegrasyonunu kontrol et
    const { db } = await import('@/lib/db')
    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId }
    })

    if (!integration || !integration.syncEnabled) {
      return { success: false, error: 'Google Calendar entegrasyonu bulunamadı veya deaktif' }
    }

    // Access token'ı yenile (gerekirse)
    let accessToken = integration.accessToken
    if (integration.refreshToken) {
      const refreshedToken = await refreshAccessToken(integration.refreshToken)
      if (refreshedToken) {
        accessToken = refreshedToken
        // Yeni token'ı veritabanında güncelle
        await db.googleCalendarIntegration.update({
          where: { userId },
          data: { accessToken: refreshedToken }
        })
      }
    }

    let result = { success: false, eventId: undefined as string | undefined, error: undefined as string | undefined }

    // Planner Takvimi ID'sini kullan
    const plannerCalendarId = integration.plannerCalendarId || 'primary'

    switch (action) {
      case 'CREATE':
        const eventId = await createCalendarEvent(accessToken, plannerCalendarId, task)
        if (eventId) {
          // TaskCalendarEvent kaydı oluştur
          await db.taskCalendarEvent.create({
            data: {
              taskId: task.id,
              googleEventId: eventId,
              calendarId: plannerCalendarId,
              syncStatus: 'SYNCED',
              lastSyncAt: new Date(),
            }
          })
          result = { success: true, eventId }
        } else {
          result = { success: false, error: 'Event oluşturulamadı' }
        }
        break

      case 'UPDATE':
        // Mevcut event kaydını bul
        const existingEvent = await db.taskCalendarEvent.findUnique({
          where: { taskId: task.id }
        })

        if (existingEvent) {
          const updateSuccess = await updateCalendarEvent(
            accessToken,
            existingEvent.calendarId || plannerCalendarId,
            existingEvent.googleEventId,
            task
          )
          
          if (updateSuccess) {
            // Sync durumunu güncelle
            await db.taskCalendarEvent.update({
              where: { taskId: task.id },
              data: {
                syncStatus: 'SYNCED',
                lastSyncAt: new Date(),
                errorMessage: null,
              }
            })
            result = { success: true, eventId: existingEvent.googleEventId }
          } else {
            await db.taskCalendarEvent.update({
              where: { taskId: task.id },
              data: {
                syncStatus: 'ERROR',
                errorMessage: 'Event güncellenemedi',
              }
            })
            result = { success: false, error: 'Event güncellenemedi' }
          }
        } else {
          // Event yoksa yeni oluştur
          const newEventId = await createCalendarEvent(accessToken, plannerCalendarId, task)
          if (newEventId) {
            await db.taskCalendarEvent.create({
              data: {
                taskId: task.id,
                googleEventId: newEventId,
                calendarId: plannerCalendarId,
                syncStatus: 'SYNCED',
                lastSyncAt: new Date(),
              }
            })
            result = { success: true, eventId: newEventId }
          } else {
            result = { success: false, error: 'Event oluşturulamadı' }
          }
        }
        break

      case 'DELETE':
        const eventToDelete = await db.taskCalendarEvent.findUnique({
          where: { taskId: task.id }
        })

        if (eventToDelete) {
          const deleteSuccess = await deleteCalendarEvent(
            accessToken,
            eventToDelete.calendarId || plannerCalendarId,
            eventToDelete.googleEventId
          )

          if (deleteSuccess) {
            // TaskCalendarEvent kaydını sil
            await db.taskCalendarEvent.delete({
              where: { taskId: task.id }
            })
            result = { success: true }
          } else {
            result = { success: false, error: 'Event silinemedi' }
          }
        } else {
          result = { success: true } // Zaten event yok
        }
        break
    }

    // Integration'ın son sync zamanını güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: { lastSyncAt: new Date() }
    })

    return result

  } catch (error) {
    console.error('Calendar sync hatası:', error)
    return { success: false, error: 'Sync işlemi başarısız' }
  }
}

// Conflict resolution - aynı anda iki yerde değişiklik durumu
export async function resolveConflict(
  taskId: string,
  taskUpdatedAt: Date,
  eventUpdatedAt: Date,
  strategy: 'TASK_WINS' | 'CALENDAR_WINS' | 'LATEST_WINS' = 'LATEST_WINS'
): Promise<{ winner: 'TASK' | 'CALENDAR' | 'NONE' }> {
  try {
    switch (strategy) {
      case 'TASK_WINS':
        return { winner: 'TASK' }
      
      case 'CALENDAR_WINS':
        return { winner: 'CALENDAR' }
      
      case 'LATEST_WINS':
      default:
        // Son güncelleme zamanına göre karar ver
        if (taskUpdatedAt > eventUpdatedAt) {
          return { winner: 'TASK' }
        } else if (eventUpdatedAt > taskUpdatedAt) {
          return { winner: 'CALENDAR' }
        } else {
          return { winner: 'NONE' } // Aynı zamanda güncellenmiş
        }
    }
  } catch (error) {
    console.error('Conflict resolution hatası:', error)
    return { winner: 'NONE' }
  }
}

// Bulk sync - tüm görevleri ve calendar event'lerini karşılaştır
export async function performBulkSync(userId: string): Promise<{
  success: boolean
  processed: number
  conflicts: number
  errors: string[]
}> {
  try {
    const { db } = await import('@/lib/db')
    
    // Kullanıcının entegrasyonunu al
    const integration = await db.googleCalendarIntegration.findUnique({
      where: { userId }
    })

    if (!integration || !integration.syncEnabled) {
      return {
        success: false,
        processed: 0,
        conflicts: 0,
        errors: ['Entegrasyon bulunamadı veya deaktif']
      }
    }

    // Access token'ı yenile
    let accessToken = integration.accessToken
    if (integration.refreshToken) {
      const refreshedToken = await refreshAccessToken(integration.refreshToken)
      if (refreshedToken) {
        accessToken = refreshedToken
      }
    }

    // Calendar event'lerini al
    const calendar = createCalendarClient(accessToken)
    const eventsResponse = await calendar.events.list({
      calendarId: integration.plannerCalendarId || integration.calendarIds?.[0] || 'primary',
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Son 30 gün
      singleEvents: true,
      orderBy: 'updated'
    })

    const events = eventsResponse.data.items || []
    
    // Task'ları al
    const tasks = await db.task.findMany({
      where: { userId },
      include: {
        calendarEvent: true
      }
    })

    const stats = {
      success: true,
      processed: 0,
      conflicts: 0,
      errors: [] as string[]
    }

    // Her task için sync kontrol et
    for (const task of tasks) {
      try {
        const correspondingEvent = events.find(event => 
          task.calendarEvent?.googleEventId === event.id
        )

        if (correspondingEvent && task.calendarEvent) {
          // Conflict kontrol et
          const taskUpdated = new Date(task.updatedAt)
          const eventUpdated = new Date(correspondingEvent.updated!)
          
          const timeDiff = Math.abs(taskUpdated.getTime() - eventUpdated.getTime())
          
          // 1 dakikadan fazla fark varsa conflict olabilir
          if (timeDiff > 60000) {
            const resolution = await resolveConflict(task.id, taskUpdated, eventUpdated)
            
            if (resolution.winner === 'CALENDAR') {
              // Calendar wins - task'ı güncelle
              const eventData = convertCalendarEventToTask(correspondingEvent)
              await db.task.update({
                where: { id: task.id },
                data: {
                  title: eventData.title,
                  description: eventData.description,
                  priority: eventData.priority,
                  dueDate: eventData.dueDate ? new Date(eventData.dueDate) : null,
                }
              })
            } else if (resolution.winner === 'TASK') {
              // Task wins - calendar'ı güncelle
              await updateCalendarEvent(accessToken, integration.plannerCalendarId || integration.calendarIds?.[0] || 'primary', task.calendarEvent.googleEventId, task)
            }
            
            stats.conflicts++
          }
        }
        
        stats.processed++
      } catch (error) {
        stats.errors.push(`Task ${task.title}: ${error.message}`)
      }
    }

    return stats
  } catch (error) {
    console.error('Bulk sync hatası:', error)
    return {
      success: false,
      processed: 0,
      conflicts: 0,
      errors: ['Bulk sync başarısız']
    }
  }
}