import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { NotificationPayload } from '@/types/notification'

// GET - Kullanıcının bildirimlerini getir
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Database migration tamamlandıktan sonra bu kodu aktifleştirin:
    /*
    const notifications = await db.inAppNotification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Son 50 bildirim
    })
    
    return NextResponse.json(notifications)
    */
    
    // Migration tamamlanana kadar boş array döndür
    return NextResponse.json([])

  } catch (error) {
    console.error('Bildirimler getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirimler getirilemedi' },
      { status: 500 }
    )
  }
}

// POST - Yeni bildirim oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    const payload: NotificationPayload = await request.json()

    // Database migration tamamlandıktan sonra bu kodu aktifleştirin:
    /*
    const notification = await db.inAppNotification.create({
      data: {
        userId: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'MEDIUM',
        taskId: payload.taskId,
        reminderId: payload.reminderId,
        metadata: payload.metadata || {}
      }
    })

    return NextResponse.json(notification, { status: 201 })
    */
    
    // Migration tamamlanana kadar mock response döndür
    const mockNotification = {
      id: Date.now().toString(),
      userId: userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'MEDIUM',
      isRead: false,
      taskId: payload.taskId,
      reminderId: payload.reminderId,
      metadata: payload.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return NextResponse.json(mockNotification, { status: 201 })

  } catch (error) {
    console.error('Bildirim oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Bildirim oluşturulamadı' },
      { status: 500 }
    )
  }
}

// DELETE - Tüm bildirimleri temizle
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Database migration tamamlandıktan sonra bu kodu aktifleştirin:
    /*
    await db.inAppNotification.deleteMany({
      where: {
        userId: userId
      }
    })
    */

    return NextResponse.json({ message: 'Tüm bildirimler temizlendi' })

  } catch (error) {
    console.error('Bildirimler temizlenirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirimler temizlenemedi' },
      { status: 500 }
    )
  }
}