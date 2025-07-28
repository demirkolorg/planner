import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// PATCH - Belirli bir bildirimi okundu olarak işaretle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    const notificationId = params.id

    // Database migration tamamlandıktan sonra bu kodu aktifleştirin:
    /*
    const notification = await db.inAppNotification.findFirst({
      where: {
        id: notificationId,
        userId: userId
      }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Bildirim bulunamadı' },
        { status: 404 }
      )
    }

    const updatedNotification = await db.inAppNotification.update({
      where: {
        id: notificationId
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json(updatedNotification)
    */
    
    // Migration tamamlanana kadar mock response döndür
    const mockNotification = {
      id: notificationId,
      userId: userId,
      type: 'REMINDER',
      title: 'Mock Notification',
      message: 'This is a mock notification',
      priority: 'MEDIUM',
      isRead: true,
      taskId: null,
      reminderId: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return NextResponse.json(mockNotification)

  } catch (error) {
    console.error('Bildirim okundu olarak işaretlenirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirim işaretlenemedi' },
      { status: 500 }
    )
  }
}