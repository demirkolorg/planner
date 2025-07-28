import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { ReminderCheckResult } from '@/types/notification'

export async function GET(request: NextRequest) {
  try {
    // JWT token'ı kontrol et
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Şu anki zamanı al
    const now = new Date()
    
    // Aktif ve zamanı gelmiş hatırlatıcıları bul
    // Not: notified field henüz migrate edilmemiş olabilir, bu yüzden geçici olarak sadece datetime kontrolü yapıyoruz
    const pendingReminders = await db.reminder.findMany({
      where: {
        isActive: true,
        datetime: {
          lte: now // Şu anki zamandan önce veya eşit olan
        },
        task: {
          userId: userId,
          completed: false // Sadece tamamlanmamış görevlerin hatırlatıcıları
        }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            completed: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      },
      take: 10 // Güvenlik için maksimum 10 hatırlatıcı
    })

    // Şimdilik bildirildi olarak işaretleme yapmıyoruz (migration gerekli)
    console.log(`${pendingReminders.length} hatırlatıcı bulundu`)

    const result: ReminderCheckResult = {
      pendingReminders: pendingReminders.map(reminder => ({
        id: reminder.id,
        taskId: reminder.taskId,
        datetime: reminder.datetime,
        message: reminder.message,
        task: {
          id: reminder.task.id,
          title: reminder.task.title,
          description: reminder.task.description
        }
      })),
      processedCount: pendingReminders.length
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Hatırlatıcı kontrolünde hata:', error)
    return NextResponse.json(
      { error: 'Hatırlatıcı kontrolü başarısız' },
      { status: 500 }
    )
  }
}