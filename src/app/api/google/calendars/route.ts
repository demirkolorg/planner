import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { createCalendarClient, refreshAccessToken } from '@/lib/google-calendar'

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

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı'
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

    // Calendar client oluştur
    const calendar = createCalendarClient(accessToken)

    // Kullanıcının tüm takvimlerini listele
    const calendarsResponse = await calendar.calendarList.list()
    const calendars = calendarsResponse.data.items || []

    // Takvim bilgilerini düzenle
    const formattedCalendars = calendars
      .filter(cal => cal.accessRole === 'owner' || cal.accessRole === 'writer') // Sadece yazılabilir takvimleri
      .map(cal => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        primary: cal.primary === true,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        accessRole: cal.accessRole,
        selected: cal.selected !== false, // Kullanıcının seçili takvimi
        timeZone: cal.timeZone
      }))
      .sort((a, b) => {
        // Primary takvimi en üste koy
        if (a.primary) return -1
        if (b.primary) return 1
        // Sonra alfabetik sırala
        return a.name?.localeCompare(b.name || '') || 0
      })

    return NextResponse.json({
      success: true,
      calendars: formattedCalendars,
      selectedCalendarIds: integration.calendarIds || [integration.calendarId || 'primary'] // Backward compatibility
    })

  } catch (error) {
    console.error('Takvim listesi alma hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Takvim listesi alınamadı' },
      { status: 500 }
    )
  }
}