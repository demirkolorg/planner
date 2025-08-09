import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
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

// Atamaları getir
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json({ 
        error: 'targetType ve targetId parametreleri gerekli' 
      }, { status: 400 })
    }

    // Atamaları getir
    const assignments = await db.assignment.findMany({
      where: {
        targetType,
        targetId,
        status: { in: ['ACTIVE', 'PENDING'] }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
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

    // Aktif kullanıcılar ve bekleyen email'ler
    const activeUsers = assignments.filter(a => a.userId && a.status === 'ACTIVE')
    const pendingEmails = assignments.filter(a => a.email && a.status === 'PENDING')

    return NextResponse.json({
      activeUsers,
      pendingEmails,
      total: assignments.length
    })

  } catch (error) {
    console.error('Assignment listing error:', error)
    return NextResponse.json(
      { error: 'Atamalar listelenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Yeni atama oluştur
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetType, targetId, userIds, emails, message } = body

    // Parametreleri kontrol et
    if (!targetType || !targetId) {
      return NextResponse.json({ 
        error: 'targetType ve targetId gerekli' 
      }, { status: 400 })
    }

    if (!['PROJECT', 'SECTION', 'TASK'].includes(targetType)) {
      return NextResponse.json({ 
        error: 'targetType PROJECT, SECTION veya TASK olmalı' 
      }, { status: 400 })
    }

    if ((!userIds || userIds.length === 0) && (!emails || emails.length === 0)) {
      return NextResponse.json({ 
        error: 'En az bir kullanıcı veya email seçmelisiniz' 
      }, { status: 400 })
    }

    const results = {
      userAssignments: [] as any[],
      emailAssignments: [] as any[],
      errors: [] as string[]
    }

    // Kullanıcı atamaları
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      for (const assigneeId of userIds) {
        try {
          // Kullanıcı var mı kontrol et
          const user = await db.user.findUnique({
            where: { id: assigneeId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          })

          if (!user) {
            results.errors.push(`Kullanıcı bulunamadı: ${assigneeId}`)
            continue
          }

          // Zaten atanmış mı kontrol et
          const existingAssignment = await db.assignment.findFirst({
            where: {
              targetType,
              targetId,
              userId: assigneeId,
              status: 'ACTIVE'
            }
          })

          if (existingAssignment) {
            results.errors.push(`${user.firstName} ${user.lastName} zaten atanmış`)
            continue
          }

          // Atama oluştur
          const assignment = await db.assignment.create({
            data: {
              targetType,
              targetId,
              userId: assigneeId,
              email: null,
              assignedBy: userId,
              status: 'ACTIVE',
              message: message || 'Basit atama sistemi ile atandı'
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

          results.userAssignments.push(assignment)

        } catch (error) {
          console.error('User assignment error:', error)
          results.errors.push(`Kullanıcı atama hatası: ${assigneeId}`)
        }
      }
    }

    // Email atamaları
    if (emails && Array.isArray(emails) && emails.length > 0) {
      for (const email of emails) {
        try {
          // Email formatını kontrol et
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(email)) {
            results.errors.push(`Geçersiz email formatı: ${email}`)
            continue
          }

          // Bu email ile kayıtlı kullanıcı var mı kontrol et
          const existingUser = await db.user.findUnique({
            where: { email }
          })

          if (existingUser) {
            results.errors.push(`${email} adresi ile kayıtlı kullanıcı zaten var. Lütfen kullanıcı listesinden seçin.`)
            continue
          }

          // Zaten email ataması var mı kontrol et
          const existingEmailAssignment = await db.assignment.findFirst({
            where: {
              targetType,
              targetId,
              email: email,
              status: 'PENDING'
            }
          })

          if (existingEmailAssignment) {
            results.errors.push(`${email} için zaten bekleyen atama var`)
            continue
          }

          // Email ataması oluştur
          const assignment = await db.assignment.create({
            data: {
              targetType,
              targetId,
              userId: null,
              email: email,
              assignedBy: userId,
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
              message: message || 'Email davetiyesi'
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

          results.emailAssignments.push(assignment)

          // Email gönder
          try {
            let targetName = 'Unknown Target'
            let projectName = undefined

            if (targetType === 'PROJECT') {
              const project = await db.project.findUnique({
                where: { id: targetId },
                select: { name: true }
              })
              targetName = project?.name || 'Unknown Project'
              projectName = targetName
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

            await sendAssignmentInvitationEmail(email, {
              targetType,
              targetId,
              targetName,
              projectName,
              assignerName: `${assignment.assigner.firstName} ${assignment.assigner.lastName}`,
              assignmentId: assignment.id,
              message
            })
          } catch (emailError) {
            console.error('Email sending error:', emailError)
            // Email hatası ana işlemi engellemez
          }

        } catch (error) {
          console.error('Email assignment error:', error)
          results.errors.push(`Email atama hatası: ${email}`)
        }
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { error: 'Atama oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}