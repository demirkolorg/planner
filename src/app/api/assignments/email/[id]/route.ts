import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Email assignment detaylarını getir (public endpoint - giriş gerektirmez)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params

    const assignment = await db.emailAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Atama bulunamadı' 
      }, { status: 404 })
    }

    // Süre dolmuş mu kontrol et
    if (assignment.expiresAt && assignment.expiresAt < new Date()) {
      // Expire durumuna güncelle
      await db.emailAssignment.update({
        where: { id: assignmentId },
        data: { status: 'EXPIRED' }
      })
      
      assignment.status = 'EXPIRED'
    }

    return NextResponse.json({ assignment })

  } catch (error) {
    console.error('Email assignment fetch error:', error)
    return NextResponse.json(
      { error: 'Atama bilgileri alınırken hata oluştu' },
      { status: 500 }
    )
  }
}