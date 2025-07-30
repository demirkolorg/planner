import { createCalendarClient } from './google-calendar'
import { db } from './db'

// Planner Takvimi'nde manuel eklenen event'leri tespit et
export async function detectManualEvents(
  accessToken: string, 
  plannerCalendarId: string, 
  userId: string
): Promise<{
  manualEvents: any[]
  hasManualEvents: boolean
  warnings: string[]
}> {
  try {
    const calendar = createCalendarClient(accessToken)
    
    // Planner Takvimi'ndeki tüm event'leri al
    const eventsResponse = await calendar.events.list({
      calendarId: plannerCalendarId,
      timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Son 30 gün
      singleEvents: true,
      orderBy: 'created'
    })

    const calendarEvents = eventsResponse.data.items || []
    
    // Veritabanındaki TaskCalendarEvent kayıtlarını al
    const trackedEvents = await db.taskCalendarEvent.findMany({
      where: {
        task: { userId },
        calendarId: plannerCalendarId
      },
      select: { googleEventId: true }
    })

    const trackedEventIds = new Set(trackedEvents.map(e => e.googleEventId))
    
    // Manuel eklenen event'leri tespit et (tracked olmayan event'ler)
    const manualEvents = calendarEvents.filter(event => 
      event.id && !trackedEventIds.has(event.id)
    )

    const warnings: string[] = []
    
    if (manualEvents.length > 0) {
      warnings.push(`Planner Takvimi'nde ${manualEvents.length} manuel event tespit edildi`)
      warnings.push('Bu event\'ler Planner uygulamasıyla senkronize edilmeyecek')
      warnings.push('Lütfen event\'leri Planner uygulamasından oluşturun')
    }

    return {
      manualEvents,
      hasManualEvents: manualEvents.length > 0,
      warnings
    }

  } catch (error) {
    console.error('Manuel event tespiti hatası:', error)
    return {
      manualEvents: [],
      hasManualEvents: false,
      warnings: ['Manuel event kontrolü yapılamadı']
    }
  }
}

// Manuel event'leri temizle (kullanıcı onayı ile)
export async function cleanupManualEvents(
  accessToken: string,
  plannerCalendarId: string,
  eventIds: string[]
): Promise<{ success: boolean; removed: number; errors: string[] }> {
  const calendar = createCalendarClient(accessToken)
  let removed = 0
  const errors: string[] = []

  for (const eventId of eventIds) {
    try {
      await calendar.events.delete({
        calendarId: plannerCalendarId,
        eventId
      })
      removed++
    } catch (error) {
      errors.push(`Event ${eventId} silinemedi: ${error}`)
    }
  }

  return {
    success: errors.length === 0,
    removed,
    errors
  }
}

// Planner Takvimi uyarı mesajını güncelle
export async function updatePlannerCalendarWarning(
  accessToken: string,
  plannerCalendarId: string,
  manualEventCount: number = 0
): Promise<void> {
  try {
    const calendar = createCalendarClient(accessToken)
    
    const warningText = manualEventCount > 0 
      ? `⚠️ UYARI: ${manualEventCount} MANUEL EVENT TESPİT EDİLDİ\n\n`
      : ''

    const updatedDescription = `${warningText}⚠️ OTOMATIK TAKVIM - MANUEL DÜZENLEME YAPMAYIN\n\nBu takvim Planner uygulaması tarafından otomatik olarak yönetilir.\n• Manuel event eklemeyin\n• Mevcut event'leri düzenlemeyin\n• Bu takvimi silmeyin\n\nTüm değişiklikler Planner uygulamasından yapılmalıdır.`

    await calendar.calendars.update({
      calendarId: plannerCalendarId,
      requestBody: {
        description: updatedDescription
      }
    })

  } catch (error) {
    console.error('Planner Takvimi uyarı güncelleme hatası:', error)
  }
}