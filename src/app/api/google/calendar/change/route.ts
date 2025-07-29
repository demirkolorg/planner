import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

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

    const { calendarIds, calendarNames } = await request.json()

    if (!calendarIds || !Array.isArray(calendarIds) || calendarIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'En az bir takvim seçilmeli' },
        { status: 400 }
      )
    }

    // Google Calendar entegrasyonunu güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: { 
        calendarIds,
        lastSyncAt: null // Takvim değiştiğinde sync'i sıfırla
      }
    })

    const selectedCount = calendarIds.length
    const message = selectedCount === 1 
      ? `"${calendarNames?.[0] || 'Takvim'}" seçildi`
      : `${selectedCount} takvim seçildi`

    return NextResponse.json({
      success: true,
      message,
      calendarIds
    })

  } catch (error) {
    console.error('Takvim değiştirme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Takvim değiştirilemedi' },
      { status: 500 }
    )
  }
}