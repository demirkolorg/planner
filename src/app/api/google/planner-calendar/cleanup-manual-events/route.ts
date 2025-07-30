import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { refreshAccessToken } from '@/lib/google-calendar'
import { detectManualEvents, cleanupManualEvents, updatePlannerCalendarWarning } from '@/lib/planner-calendar-protection'

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

    if (!integration || !integration.plannerCalendarId) {
      return NextResponse.json({
        success: false,
        error: 'Planner Takvimi bulunamadı'
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

    // Manuel event'leri tespit et
    const manualEventCheck = await detectManualEvents(
      accessToken, 
      integration.plannerCalendarId, 
      userId
    )

    if (!manualEventCheck.hasManualEvents) {
      return NextResponse.json({
        success: true,
        message: 'Temizlenecek manuel event bulunamadı',
        removed: 0
      })
    }

    // Manuel event'leri temizle
    const eventIds = manualEventCheck.manualEvents.map(event => event.id)
    const cleanupResult = await cleanupManualEvents(
      accessToken,
      integration.plannerCalendarId,
      eventIds
    )

    // Takvim uyarısını güncelle (temizlik sonrası)
    await updatePlannerCalendarWarning(
      accessToken, 
      integration.plannerCalendarId, 
      0 // Temizlik sonrası manuel event sayısı 0
    )

    if (cleanupResult.success) {
      return NextResponse.json({
        success: true,
        message: `${cleanupResult.removed} manuel event başarıyla temizlendi`,
        removed: cleanupResult.removed
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Bazı event\'ler temizlenemedi',
        removed: cleanupResult.removed,
        errors: cleanupResult.errors
      }, { status: 207 }) // Partial success
    }

  } catch (error) {
    console.error('Manuel event temizleme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Manuel event temizleme başarısız' },
      { status: 500 }
    )
  }
}

// Manuel event'leri sadece kontrol et (temizleme yapmadan)
export async function GET(request: NextRequest) {
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

    if (!integration || !integration.plannerCalendarId) {
      return NextResponse.json({
        success: false,
        error: 'Planner Takvimi bulunamadı'
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

    // Manuel event'leri tespit et
    const manualEventCheck = await detectManualEvents(
      accessToken, 
      integration.plannerCalendarId, 
      userId
    )

    return NextResponse.json({
      success: true,
      hasManualEvents: manualEventCheck.hasManualEvents,
      manualEventCount: manualEventCheck.manualEvents.length,
      manualEvents: manualEventCheck.manualEvents.map(event => ({
        id: event.id,
        title: event.summary || 'Başlıksız Event',
        start: event.start?.dateTime || event.start?.date,
        created: event.created
      })),
      warnings: manualEventCheck.warnings
    })

  } catch (error) {
    console.error('Manuel event kontrol hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Manuel event kontrolü başarısız' },
      { status: 500 }
    )
  }
}