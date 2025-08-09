import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getUserProjectAccess } from '@/lib/access-control'
import { sendAssignmentInvitationEmail } from '@/lib/email'

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

// Email bazlı atama oluştur (genel endpoint)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, targetType, targetId, message } = body

    // Parametreleri kontrol et
    if (!email || !targetType || !targetId) {
      return NextResponse.json({ 
        error: 'Email, targetType ve targetId gerekli' 
      }, { status: 400 })
    }

    if (!['PROJECT', 'SECTION', 'TASK'].includes(targetType)) {
      return NextResponse.json({ 
        error: 'targetType PROJECT, SECTION veya TASK olmalı' 
      }, { status: 400 })
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Geçersiz email formatı' 
      }, { status: 400 })
    }

    // Bu email ile kayıtlı kullanıcı var mı kontrol et
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Bu email adresi ile kayıtlı kullanıcı zaten var. Lütfen kullanıcı listesinden seçin.' 
      }, { status: 400 })
    }

    let projectId: string

    // Target'ı ve erişim yetkilerini kontrol et
    if (targetType === 'PROJECT') {
      projectId = targetId
      
      // Proje var mı kontrol et
      const project = await db.project.findUnique({
        where: { id: projectId }
      })
      
      if (!project) {
        return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 })
      }

    } else if (targetType === 'SECTION') {
      // Bölüm var mı ve proje ID'sini al
      const section = await db.section.findUnique({
        where: { id: targetId },
        select: { projectId: true }
      })
      
      if (!section) {
        return NextResponse.json({ error: 'Bölüm bulunamadı' }, { status: 404 })
      }
      
      projectId = section.projectId

    } else if (targetType === 'TASK') {
      // Görev var mı ve proje ID'sini al
      const task = await db.task.findUnique({
        where: { id: targetId },
        select: { projectId: true }
      })
      
      if (!task || !task.projectId) {
        return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 })
      }
      
      projectId = task.projectId
    }

    // Projeye atama yapma yetkisi var mı kontrol et
    const access = await getUserProjectAccess(userId, projectId!)
    
    if (access.accessLevel === 'NO_ACCESS' || !access.permissions.canAssignTasks) {
      return NextResponse.json({ 
        error: 'Atama yapma yetkiniz yok' 
      }, { status: 403 })
    }

    // Zaten aynı email ataması var mı kontrol et
    const existingEmailAssignment = await db.emailAssignment.findFirst({
      where: {
        email,
        targetType,
        targetId,
        status: 'PENDING'
      }
    })

    if (existingEmailAssignment) {
      return NextResponse.json({ 
        error: 'Bu email adresi için zaten bekleyen atama var' 
      }, { status: 400 })
    }

    // Email ataması oluştur
    const emailAssignment = await db.emailAssignment.create({
      data: {
        email,
        targetType,
        targetId,
        role: (targetType === 'PROJECT' ? 'COLLABORATOR' : 'MEMBER'), // Sabit rol
        assignedBy: userId,
        message,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 gün sonra expire
      },
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

    // Email gönder
    try {
      const assigner = await db.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      })

      let targetName = ''
      let projectName: string | undefined

      // Target bilgilerini al
      if (targetType === 'PROJECT') {
        const project = await db.project.findUnique({
          where: { id: targetId },
          select: { name: true }
        })
        targetName = project?.name || 'Unknown Project'
      } else if (targetType === 'SECTION') {
        const section = await db.section.findUnique({
          where: { id: targetId },
          include: {
            project: { select: { name: true } }
          }
        })
        targetName = section?.name || 'Unknown Section'
        projectName = section?.project.name
      } else if (targetType === 'TASK') {
        const task = await db.task.findUnique({
          where: { id: targetId },
          include: {
            project: { select: { name: true } }
          }
        })
        targetName = task?.title || 'Unknown Task'
        projectName = task?.project?.name
      }

      if (assigner) {
        await sendAssignmentInvitationEmail(email, {
          targetType,
          targetId,
          targetName,
          projectName,
          assignerName: `${assigner.firstName} ${assigner.lastName}`,
          assignmentId: emailAssignment.id,
          message
        })
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Email hatası ana işlemi engellemez
    }

    return NextResponse.json({
      message: 'Email ataması başarıyla oluşturuldu',
      assignment: emailAssignment
    })

  } catch (error) {
    console.error('Email assignment error:', error)
    return NextResponse.json(
      { error: 'Email ataması sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

// Bekleyen email atamalarını listele
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const email = searchParams.get('email')

    let whereClause: any = {
      status: 'PENDING'
    }

    // Sadece belirli bir target için atamaları listele
    if (targetType && targetId) {
      whereClause.targetType = targetType
      whereClause.targetId = targetId
    }

    // Belirli bir email için atamaları listele
    if (email) {
      whereClause.email = email
    }

    // Kullanıcının yaptığı email atamalarını listele
    whereClause.assignedBy = userId

    const emailAssignments = await db.emailAssignment.findMany({
      where: whereClause,
      include: {
        assigner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json({ emailAssignments })

  } catch (error) {
    console.error('Email assignments listing error:', error)
    return NextResponse.json(
      { error: 'Email atamaları listelenirken hata oluştu' },
      { status: 500 }
    )
  }
}