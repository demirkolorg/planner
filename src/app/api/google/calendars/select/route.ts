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

    // Request body'den seçili takvim ID'lerini al
    const { readOnlyCalendarIds } = await request.json()

    if (!Array.isArray(readOnlyCalendarIds)) {
      return NextResponse.json({
        success: false,
        error: 'readOnlyCalendarIds bir array olmalıdır'
      }, { status: 400 })
    }

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

    // Planner Takvimi'nin readOnlyCalendarIds'de olmaması gerekiyor
    if (integration.plannerCalendarId && readOnlyCalendarIds.includes(integration.plannerCalendarId)) {
      return NextResponse.json({
        success: false,
        error: 'Planner Takvimi okunacak takvimler arasında olamaz'
      }, { status: 400 })
    }

    // Database'i güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: {
        readOnlyCalendarIds
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Okunacak takvimler güncellendi',
      readOnlyCalendarIds
    })

  } catch (error) {
    console.error('Takvim seçimi güncelleme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Takvim seçimi güncellenemedi' },
      { status: 500 }
    )
  }
}