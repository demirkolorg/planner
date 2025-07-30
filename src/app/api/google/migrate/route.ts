import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

// Mevcut kullanıcıları yeni Planner Takvimi sistemine migrate et
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü veya JWT kontrolü yapılabilir
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    console.log('🔄 Migration başlatılıyor...')

    // Tüm Google Calendar entegrasyonlarını al
    const integrations = await db.googleCalendarIntegration.findMany({
      where: {
        // Sadece belirli bir kullanıcı için (güvenlik)
        userId
      }
    })

    const results = {
      processed: 0,
      migrated: 0,
      alreadyMigrated: 0,
      errors: [] as string[]
    }

    for (const integration of integrations) {
      results.processed++
      
      try {
        // Zaten yeni sistemde mi?
        if (integration.plannerCalendarCreated && integration.plannerCalendarId) {
          console.log(`✅ ${integration.userId} zaten migrate edilmiş`)
          results.alreadyMigrated++
          continue
        }

        // Eski calendarIds'leri readOnlyCalendarIds'e taşı
        const readOnlyCalendarIds = integration.calendarIds || []
        
        // Migration: Eski sistem verilerini yeni sisteme taşı
        await db.googleCalendarIntegration.update({
          where: { id: integration.id },
          data: {
            readOnlyCalendarIds,
            plannerCalendarCreated: false,
            plannerCalendarId: null
          }
        })

        console.log(`🔄 ${integration.userId} migrate edildi:`)
        console.log(`   - readOnlyCalendarIds: [${readOnlyCalendarIds.join(', ')}]`)
        console.log(`   - plannerCalendarCreated: false (otomatik oluşturulacak)`)
        
        results.migrated++
        
      } catch (error) {
        console.error(`❌ ${integration.userId} migration hatası:`, error)
        results.errors.push(`${integration.userId}: ${error.message}`)
      }
    }

    console.log('✅ Migration tamamlandı:', results)

    return NextResponse.json({
      success: true,
      message: 'Migration başarıyla tamamlandı',
      results
    })

  } catch (error) {
    console.error('Migration genel hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Migration başarısız' },
      { status: 500 }
    )
  }
}