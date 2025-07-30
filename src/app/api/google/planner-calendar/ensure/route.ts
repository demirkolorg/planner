import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { createPlannerCalendar, checkPlannerCalendarExists, refreshAccessToken } from '@/lib/google-calendar'

// Planner Takvimi'nin var olduğundan emin ol - yoksa oluştur
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

    let plannerCalendarId = integration.plannerCalendarId
    let needsCreation = false

    // Eğer database'de Planner Takvimi ID'si varsa, gerçekten var mı kontrol et
    if (plannerCalendarId && integration.plannerCalendarCreated) {
      const exists = await checkPlannerCalendarExists(accessToken, plannerCalendarId)
      if (!exists) {
        console.log('⚠️ Planner Takvimi database\'de var ama Google Calendar\'da yok, yeniden oluşturuluyor...')
        needsCreation = true
        plannerCalendarId = null
      }
    } else {
      needsCreation = true
    }

    // Planner Takvimi oluştur (gerekirse)
    if (needsCreation) {
      plannerCalendarId = await createPlannerCalendar(accessToken)
      
      if (!plannerCalendarId) {
        return NextResponse.json({
          success: false,
          error: 'Planner Takvimi oluşturulamadı'
        }, { status: 500 })
      }

      // Database'i güncelle
      await db.googleCalendarIntegration.update({
        where: { userId },
        data: {
          plannerCalendarId,
          plannerCalendarCreated: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: needsCreation ? 'Planner Takvimi oluşturuldu' : 'Planner Takvimi mevcut',
      calendarId: plannerCalendarId,
      created: needsCreation
    })

  } catch (error) {
    console.error('Planner Takvimi ensure API hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Planner Takvimi kontrol edilemedi' },
      { status: 500 }
    )
  }
}