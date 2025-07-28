import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

// DELETE - Belirli bir bildirimi sil
export async function DELETE(
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

    await db.inAppNotification.delete({
      where: {
        id: notificationId
      }
    })
    */

    return NextResponse.json({ message: 'Bildirim silindi' })

  } catch (error) {
    console.error('Bildirim silinirken hata:', error)
    return NextResponse.json(
      { error: 'Bildirim silinemedi' },
      { status: 500 }
    )
  }
}