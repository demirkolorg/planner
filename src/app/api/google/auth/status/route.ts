import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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
      where: { userId },
      select: {
        id: true,
        googleAccountId: true,
        calendarIds: true, // Backward compatibility
        plannerCalendarId: true,
        plannerCalendarCreated: true,
        readOnlyCalendarIds: true,
        syncEnabled: true,
        lastSyncAt: true,
        createdAt: true,
      }
    })

    if (!integration) {
      return NextResponse.json({
        success: true,
        connected: false,
        integration: null
      })
    }

    return NextResponse.json({
      success: true,
      connected: true,
      integration: {
        id: integration.id,
        googleAccountId: integration.googleAccountId,
        calendarId: integration.calendarIds?.[0] || 'primary', // Backward compatibility
        calendarIds: integration.calendarIds,
        plannerCalendarId: integration.plannerCalendarId,
        plannerCalendarCreated: integration.plannerCalendarCreated,
        readOnlyCalendarIds: integration.readOnlyCalendarIds,
        syncEnabled: integration.syncEnabled,
        lastSyncAt: integration.lastSyncAt,
        connectedAt: integration.createdAt,
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Durum kontrolü hatası' },
      { status: 500 }
    )
  }
}