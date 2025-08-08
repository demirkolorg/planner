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

// Email assignment'ı kabul et ve gerçek assignment'a dönüştür
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

    // Email assignment'ı bul
    const emailAssignment = await db.emailAssignment.findUnique({
      where: { id: assignmentId }
    })

    if (!emailAssignment) {
      return NextResponse.json({ 
        error: 'Email ataması bulunamadı' 
      }, { status: 404 })
    }

    // Atama PENDING durumda mı kontrol et
    if (emailAssignment.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Bu atama artık geçerli değil' 
      }, { status: 400 })
    }

    // Süre dolmuş mu kontrol et
    if (emailAssignment.expiresAt && emailAssignment.expiresAt < new Date()) {
      // Expire durumuna güncelle
      await db.emailAssignment.update({
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

    if (!user || user.email !== emailAssignment.email) {
      return NextResponse.json({ 
        error: 'Bu atamayı kabul etme yetkiniz yok' 
      }, { status: 403 })
    }

    let realAssignment: any = null

    // Transaction ile gerçek assignment oluştur ve email assignment'ı güncelle
    await db.$transaction(async (tx) => {
      // Email assignment'ı ACTIVE duruma güncelle
      await tx.emailAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'ACTIVE',
          acceptedAt: new Date()
        }
      })

      // Target tipine göre gerçek assignment oluştur
      if (emailAssignment.targetType === 'PROJECT') {
        // Zaten var olan assignment kontrol et
        const existing = await tx.projectAssignment.findFirst({
          where: {
            projectId: emailAssignment.targetId,
            assigneeId: userId
          }
        })

        if (!existing) {
          realAssignment = await tx.projectAssignment.create({
            data: {
              projectId: emailAssignment.targetId,
              assigneeId: userId,
              assignedBy: emailAssignment.assignedBy,
              role: emailAssignment.role
            }
          })
        }

      } else if (emailAssignment.targetType === 'SECTION') {
        // Zaten var olan assignment kontrol et
        const existing = await tx.sectionAssignment.findFirst({
          where: {
            sectionId: emailAssignment.targetId,
            assigneeId: userId
          }
        })

        if (!existing) {
          realAssignment = await tx.sectionAssignment.create({
            data: {
              sectionId: emailAssignment.targetId,
              assigneeId: userId,
              assignedBy: emailAssignment.assignedBy,
              role: emailAssignment.role
            }
          })
        }

      } else if (emailAssignment.targetType === 'TASK') {
        // Task assignment için önce mevcut atamaları temizle (tek kişilik sistem)
        await tx.taskAssignment.deleteMany({
          where: {
            taskId: emailAssignment.targetId
          }
        })

        realAssignment = await tx.taskAssignment.create({
          data: {
            taskId: emailAssignment.targetId,
            assigneeId: userId,
            assignedBy: emailAssignment.assignedBy
          }
        })
      }
    })

    // Atamayı yapan kişiye bildirim gönder
    try {
      const assigner = await db.user.findUnique({
        where: { id: emailAssignment.assignedBy },
        select: { email: true }
      })

      let targetName = ''
      
      // Target bilgilerini al
      if (emailAssignment.targetType === 'PROJECT') {
        const project = await db.project.findUnique({
          where: { id: emailAssignment.targetId },
          select: { name: true }
        })
        targetName = project?.name || 'Unknown Project'
      } else if (emailAssignment.targetType === 'SECTION') {
        const section = await db.section.findUnique({
          where: { id: emailAssignment.targetId },
          select: { name: true }
        })
        targetName = section?.name || 'Unknown Section'
      } else if (emailAssignment.targetType === 'TASK') {
        const task = await db.task.findUnique({
          where: { id: emailAssignment.targetId },
          select: { title: true }
        })
        targetName = task?.title || 'Unknown Task'
      }

      if (assigner) {
        await sendAssignmentAcceptedEmail(assigner.email, {
          targetType: emailAssignment.targetType,
          targetName,
          accepterName: `${user.firstName} ${user.lastName}`,
          role: emailAssignment.role
        })
      }
    } catch (emailError) {
      console.error('Assignment accepted notification error:', emailError)
      // Email hatası ana işlemi engellemez
    }

    return NextResponse.json({
      message: 'Atama başarıyla kabul edildi',
      emailAssignment,
      realAssignment
    })

  } catch (error) {
    console.error('Email assignment acceptance error:', error)
    return NextResponse.json(
      { error: 'Atama kabul edilirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Email assignment'ı reddet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = await params

    // Email assignment'ı bul
    const emailAssignment = await db.emailAssignment.findUnique({
      where: { id: assignmentId }
    })

    if (!emailAssignment) {
      return NextResponse.json({ 
        error: 'Email ataması bulunamadı' 
      }, { status: 404 })
    }

    // Kullanıcının email'i doğru mu kontrol et veya atamayı yapan kişi mi kontrol et
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user || (user.email !== emailAssignment.email && emailAssignment.assignedBy !== userId)) {
      return NextResponse.json({ 
        error: 'Bu atamayı reddetme yetkiniz yok' 
      }, { status: 403 })
    }

    // Email assignment'ı iptal et
    await db.emailAssignment.update({
      where: { id: assignmentId },
      data: { status: 'CANCELLED' }
    })

    return NextResponse.json({
      message: 'Atama başarıyla reddedildi'
    })

  } catch (error) {
    console.error('Email assignment rejection error:', error)
    return NextResponse.json(
      { error: 'Atama reddedilirken hata oluştu' },
      { status: 500 }
    )
  }
}