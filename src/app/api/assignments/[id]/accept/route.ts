import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendAssignmentAcceptedEmail } from '@/lib/email'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

// Email assignment'ı kabul et
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = await params

    // Assignment'ı bul
    const assignment = await db.assignment.findUnique({
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

    // Atama PENDING durumda mı kontrol et
    if (assignment.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Bu atama artık geçerli değil' 
      }, { status: 400 })
    }

    // Email assignment olmalı
    if (!assignment.email) {
      return NextResponse.json({ 
        error: 'Bu atama email davetiyesi değil' 
      }, { status: 400 })
    }

    // Süre dolmuş mu kontrol et
    if (assignment.expiresAt && assignment.expiresAt < new Date()) {
      // Expire durumuna güncelle
      await db.assignment.update({
        where: { id: assignmentId },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json({ 
        error: 'Bu atamanın süresi dolmuş' 
      }, { status: 400 })
    }

    // Kullanıcının email'i doğru mu kontrol et
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.email !== assignment.email) {
      return NextResponse.json({ 
        error: 'Bu atamayı kabul etme yetkiniz yok' 
      }, { status: 403 })
    }

    // Assignment'ı aktif duruma güncelle
    const updatedAssignment = await db.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'ACTIVE',
        userId: userId,
        acceptedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Davet edene bildirim email'i gönder
    try {
      let targetName = 'Unknown Target'

      if (assignment.targetType === 'PROJECT') {
        const project = await db.project.findUnique({
          where: { id: assignment.targetId },
          select: { name: true }
        })
        targetName = project?.name || 'Unknown Project'
      } else if (assignment.targetType === 'SECTION') {
        const section = await db.section.findUnique({
          where: { id: assignment.targetId },
          select: { name: true }
        })
        targetName = section?.name || 'Unknown Section'
      } else if (assignment.targetType === 'TASK') {
        const task = await db.task.findUnique({
          where: { id: assignment.targetId },
          select: { title: true }
        })
        targetName = task?.title || 'Unknown Task'
      }

      if (assignment.assigner) {
        await sendAssignmentAcceptedEmail(assignment.assigner.email, {
          targetType: assignment.targetType,
          targetName,
          accepterName: `${user.firstName} ${user.lastName}`
        })
      }
    } catch (emailError) {
      console.error('Assignment accepted notification error:', emailError)
      // Email hatası ana işlemi engellemez
    }

    return NextResponse.json({
      message: 'Atama başarıyla kabul edildi',
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Assignment accept error:', error)
    return NextResponse.json(
      { error: 'Atama kabul edilirken hata oluştu' },
      { status: 500 }
    )
  }
}