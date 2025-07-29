import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { createCalendarClient, refreshAccessToken } from '@/lib/google-calendar'
import { randomUUID } from 'crypto'

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

    if (!integration || !integration.syncEnabled) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı veya deaktif'
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

    // Webhook URL'i (production'da domain değişecek)
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.NEXTAUTH_URL}/api/google/webhook`
      : `${process.env.WEBHOOK_TUNNEL_URL || 'https://your-ngrok-url.ngrok.io'}/api/google/webhook`

    // Calendar client oluştur
    const calendar = createCalendarClient(accessToken)
    
    // Unique channel ID oluştur
    const channelId = `planner-${userId}-${randomUUID()}`
    
    // Webhook kurulum
    const watchResponse = await calendar.events.watch({
      calendarId: integration.calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        params: {
          ttl: '604800' // 7 gün (saniye cinsinden)
        }
      }
    })

    console.log('Webhook kuruldu:', watchResponse.data)

    // Webhook bilgilerini database'e kaydet (isteğe bağlı)
    // Bu bilgileri daha sonra webhook'u iptal etmek için kullanabiliriz

    return NextResponse.json({
      success: true,
      message: 'Webhook başarıyla kuruldu',
      channelId,
      resourceId: watchResponse.data.resourceId,
      expiration: watchResponse.data.expiration
    })

  } catch (error) {
    console.error('Webhook kurulum hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook kurulumu başarısız', details: error.message },
      { status: 500 }
    )
  }
}

// Mevcut webhook'ları iptal et
export async function DELETE(request: NextRequest) {
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

    // Bu endpoint'i webhook iptal etmek için kullanabilirsin
    // Şimdilik sadece başarılı response döndür
    
    return NextResponse.json({
      success: true,
      message: 'Webhook iptal edildi'
    })

  } catch (error) {
    console.error('Webhook iptal hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook iptal başarısız' },
      { status: 500 }
    )
  }
}