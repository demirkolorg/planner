import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { performBulkSync } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    // Güvenlik kontrolü - sadece authorized kaynaklardan çağrılabilir
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Periodic sync job başladı:', new Date().toISOString())

    // Tüm aktif entegrasyonları al
    const integrations = await db.googleCalendarIntegration.findMany({
      where: { 
        syncEnabled: true,
        // Son 24 saat içinde sync olmamış olanları al
        OR: [
          { lastSyncAt: null },
          {
            lastSyncAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 saat önce
            }
          }
        ]
      }
    })

    console.log(`${integrations.length} entegrasyon bulundu`)

    const results = {
      total: integrations.length,
      processed: 0,
      failed: 0,
      totalConflicts: 0,
      errors: [] as string[]
    }

    // Her entegrasyon için bulk sync yap
    for (const integration of integrations) {
      try {
        console.log(`User ${integration.userId} için sync başlıyor`)
        
        const syncResult = await performBulkSync(integration.userId)
        
        if (syncResult.success) {
          results.processed++
          results.totalConflicts += syncResult.conflicts
          
          // Son sync zamanını güncelle
          await db.googleCalendarIntegration.update({
            where: { userId: integration.userId },
            data: { lastSyncAt: new Date() }
          })
          
          console.log(`User ${integration.userId} sync tamamlandı: ${syncResult.processed} işlendi, ${syncResult.conflicts} conflict`)
        } else {
          results.failed++
          results.errors.push(`User ${integration.userId}: ${syncResult.errors.join(', ')}`)
          console.error(`User ${integration.userId} sync başarısız`)
        }
      } catch (error) {
        results.failed++
        results.errors.push(`User ${integration.userId}: Beklenmeyen hata`)
        console.error(`User ${integration.userId} sync hatası:`, error)
      }
    }

    console.log('Periodic sync job tamamlandı:', results)

    return NextResponse.json({
      success: true,
      message: 'Periodic sync tamamlandı',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Periodic sync job hatası:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Periodic sync başarısız',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Sistem durumu kontrolü
    const integrationCount = await db.googleCalendarIntegration.count({
      where: { syncEnabled: true }
    })

    const recentSyncCount = await db.googleCalendarIntegration.count({
      where: {
        syncEnabled: true,
        lastSyncAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Son 24 saat
        }
      }
    })

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalIntegrations: integrationCount,
        recentlySynced: recentSyncCount,
        needsSync: integrationCount - recentSyncCount
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}