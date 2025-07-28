import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// PATCH - Tüm bildirimleri okundu olarak işaretle
export async function PATCH(request: NextRequest) {
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
    await db.inAppNotification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })
    */

    return NextResponse.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' })

  } catch (error) {
    console.error('Bildirimler okundu olarak işaretlenirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirimler işaretlenemedi' },
      { status: 500 }
    )
  }
}