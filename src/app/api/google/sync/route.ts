import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'
import { syncTaskToCalendar } from '@/lib/google-calendar'

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

    // Kullanıcının tüm aktif (tamamlanmamış) görevlerini al
    const tasks = await db.task.findMany({
      where: {
        userId,
        completed: false // Sadece tamamlanmamış görevleri sync et
      },
      include: {
        project: true,
        section: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Sync sonuçları
    const results = {
      total: tasks.length,
      synced: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Her görevi sırayla sync et
    for (const task of tasks) {
      try {
        // Mevcut calendar event'i var mı kontrol et
        const existingEvent = await db.taskCalendarEvent.findUnique({
          where: { taskId: task.id }
        })

        const action = existingEvent ? 'UPDATE' : 'CREATE'
        const syncResult = await syncTaskToCalendar(userId, task, action)

        if (syncResult.success) {
          results.synced++
        } else {
          results.failed++
          results.errors.push(`${task.title}: ${syncResult.error}`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`${task.title}: Beklenmeyen hata`)
        console.error(`Task ${task.id} sync hatası:`, error)
      }
    }

    // Integration'ın son sync zamanını güncelle
    await db.googleCalendarIntegration.update({
      where: { userId },
      data: { lastSyncAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Manuel senkronizasyon tamamlandı',
      results
    })

  } catch (error) {
    console.error('Manuel sync hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Senkronizasyon başarısız' },
      { status: 500 }
    )
  }
}

// Sync durumunu getir
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

    // Kullanıcının sync durumunu al
    const [integration, syncStats] = await Promise.all([
      db.googleCalendarIntegration.findUnique({
        where: { userId }
      }),
      db.taskCalendarEvent.groupBy({
        by: ['syncStatus'],
        where: {
          task: {
            userId
          }
        },
        _count: {
          syncStatus: true
        }
      })
    ])

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı'
      }, { status: 400 })
    }

    // Sync istatistiklerini hazırla
    const stats = {
      synced: 0,
      pending: 0,
      error: 0
    }

    syncStats.forEach(stat => {
      switch (stat.syncStatus) {
        case 'SYNCED':
          stats.synced = stat._count.syncStatus
          break
        case 'PENDING':
          stats.pending = stat._count.syncStatus
          break
        case 'ERROR':
          stats.error = stat._count.syncStatus
          break
      }
    })

    return NextResponse.json({
      success: true,
      integration: {
        syncEnabled: integration.syncEnabled,
        lastSyncAt: integration.lastSyncAt,
        calendarId: integration.calendarId
      },
      stats
    })

  } catch (error) {
    console.error('Sync durum kontrol hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Durum kontrolü başarısız' },
      { status: 500 }
    )
  }
}