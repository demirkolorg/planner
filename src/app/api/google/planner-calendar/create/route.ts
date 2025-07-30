import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { createPlannerCalendar, refreshAccessToken } from '@/lib/google-calendar'

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

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı'
      }, { status: 400 })
    }

    // Zaten Planner Takvimi oluşturulmuş mu?
    if (integration.plannerCalendarCreated && integration.plannerCalendarId) {
      return NextResponse.json({
        success: true,
        message: 'Planner Takvimi zaten mevcut',
        calendarId: integration.plannerCalendarId
      })
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

    // Planner Takvimi oluştur
    const plannerCalendarId = await createPlannerCalendar(accessToken)
    
    if (!plannerCalendarId) {
      return NextResponse.json({
        success: false,
        error: 'Planner Takvimi oluşturulamadı. Lütfen Google Calendar bağlantınızı yenileyin - yeni yetkiler gerekli.',
        needsReauth: true
      }, { status: 403 })
    }

    // Database'i güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: {
        plannerCalendarId,
        plannerCalendarCreated: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Planner Takvimi başarıyla oluşturuldu',
      calendarId: plannerCalendarId
    })

  } catch (error) {
    console.error('Planner Takvimi oluşturma API hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Planner Takvimi oluşturulamadı' },
      { status: 500 }
    )
  }
}