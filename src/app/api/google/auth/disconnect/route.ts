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

    // Veritabanından entegrasyonu sil
    await db.googleCalendarIntegration.delete({
      where: { userId }
    })

    // İlgili calendar event kayıtlarını da sil
    await db.taskCalendarEvent.deleteMany({
      where: {
        task: {
          userId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Google Calendar entegrasyonu kaldırıldı'
    })

  } catch (error) {
    // Eğer kayıt yoksa da başarılı kabul et
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({
        success: true,
        message: 'Entegrasyon zaten mevcut değil'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Bağlantı kaldırma hatası' },
      { status: 500 }
    )
  }
}