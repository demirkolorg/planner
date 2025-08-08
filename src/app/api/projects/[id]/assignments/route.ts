import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getUserProjectAccess } from '@/lib/access-control'
import { createProjectActivity, ProjectActivityTypes } from '@/lib/project-activity'
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

// Proje atamalarını listele
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Access control kontrolü
    const access = await getUserProjectAccess(userId, projectId)
    
    if (access.accessLevel === 'NO_ACCESS' || !access.permissions.canViewProject) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    // Proje atamalarını getir
    const projectAssignments = await db.projectAssignment.findMany({
      where: { projectId },
      include: {
        assignee: {
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

    // Email bazlı atamaları da getir
    const emailAssignments = await db.emailAssignment.findMany({
      where: {
        targetType: 'PROJECT',
        targetId: projectId,
        status: 'PENDING'
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
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json({ 
      userAssignments: projectAssignments,
      emailAssignments: emailAssignments 
    })
  } catch (error) {
    console.error('Project assignments listing error:', error)
    return NextResponse.json(
      { error: 'Proje atamaları listelenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Proje ataması oluştur
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const body = await request.json()
    const { assigneeIds, emails, role = 'COLLABORATOR', message } = body

    // Access control kontrolü
    const access = await getUserProjectAccess(userId, projectId)
    
    if (access.accessLevel === 'NO_ACCESS' || !access.permissions.canAssignTasks) {
      return NextResponse.json({ error: 'Atama yapma yetkiniz yok' }, { status: 403 })
    }

    const results = {
      userAssignments: [] as any[],
      emailAssignments: [] as any[],
      errors: [] as string[]
    }

    // Kullanıcı ID'leri ile atama
    if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        try {
          // Kullanıcının var olup olmadığını kontrol et
          const assignee = await db.user.findUnique({
            where: { id: assigneeId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          })

          if (!assignee) {
            results.errors.push(`Kullanıcı bulunamadı: ${assigneeId}`)
            continue
          }

          // Zaten atanmış mı kontrol et
          const existingAssignment = await db.projectAssignment.findFirst({
            where: {
              projectId,
              assigneeId
            }
          })

          if (existingAssignment) {
            results.errors.push(`${assignee.firstName} ${assignee.lastName} zaten projeye atanmış`)
            continue
          }

          // Atamayı oluştur
          const assignment = await db.projectAssignment.create({
            data: {
              projectId,
              assigneeId,
              assignedBy: userId,
              role
            },
            include: {
              assignee: {
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

          // Activity oluştur
          await createProjectActivity({
            projectId,
            userId,
            actionType: ProjectActivityTypes.USER_ASSIGNED,
            entityType: 'project',
            entityId: assigneeId,
            entityName: `${assignee.firstName} ${assignee.lastName}`,
            newValue: role,
            description: `${assignee.firstName} ${assignee.lastName} projeye ${role} rolüyle atandı`
          })

        } catch (error) {
          console.error('User assignment error:', error)
          results.errors.push(`Atama hatası: ${assigneeId}`)
        }
      }
    }

    // Email ile atama
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
          const existingEmailAssignment = await db.emailAssignment.findFirst({
            where: {
              email,
              targetType: 'PROJECT',
              targetId: projectId,
              status: 'PENDING'
            }
          })

          if (existingEmailAssignment) {
            results.errors.push(`${email} adresi için zaten bekleyen atama var`)
            continue
          }

          // Email ataması oluştur
          const emailAssignment = await db.emailAssignment.create({
            data: {
              email,
              targetType: 'PROJECT',
              targetId: projectId,
              role,
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

          results.emailAssignments.push(emailAssignment)

          // Activity oluştur
          await createProjectActivity({
            projectId,
            userId,
            actionType: ProjectActivityTypes.EMAIL_ASSIGNED,
            entityType: 'project',
            entityId: null,
            entityName: email,
            newValue: role,
            description: `${email} email ile projeye ${role} rolüyle davet edildi`
          })

          // Email gönder
          try {
            const assigner = await db.user.findUnique({
              where: { id: userId },
              select: { firstName: true, lastName: true }
            })

            const project = await db.project.findUnique({
              where: { id: projectId },
              select: { name: true }
            })

            if (assigner && project) {
              await sendAssignmentInvitationEmail(email, {
                targetType: 'PROJECT',
                targetId: projectId,
                targetName: project.name,
                role,
                assignerName: `${assigner.firstName} ${assigner.lastName}`,
                assignmentId: emailAssignment.id,
                message
              })
            }
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

    return NextResponse.json({
      message: `${results.userAssignments.length} kullanıcı ve ${results.emailAssignments.length} email ataması oluşturuldu`,
      ...results
    })

  } catch (error) {
    console.error('Project assignment error:', error)
    return NextResponse.json(
      { error: 'Proje ataması sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

// Proje atamasını kaldır
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const assignmentType = searchParams.get('type') // 'user' or 'email'

    if (!assignmentId || !assignmentType) {
      return NextResponse.json({ error: 'AssignmentId and type are required' }, { status: 400 })
    }

    // Access control kontrolü
    const access = await getUserProjectAccess(userId, projectId)
    
    if (access.accessLevel === 'NO_ACCESS' || !access.permissions.canAssignTasks) {
      return NextResponse.json({ error: 'Atama kaldırma yetkiniz yok' }, { status: 403 })
    }

    if (assignmentType === 'user') {
      // Kullanıcı atamasını kaldır
      const deletedAssignment = await db.projectAssignment.deleteMany({
        where: {
          id: assignmentId,
          projectId
        }
      })

      if (deletedAssignment.count === 0) {
        return NextResponse.json({ error: 'Atama bulunamadı' }, { status: 404 })
      }

    } else if (assignmentType === 'email') {
      // Email atamasını kaldır
      const deletedEmailAssignment = await db.emailAssignment.updateMany({
        where: {
          id: assignmentId,
          targetType: 'PROJECT',
          targetId: projectId
        },
        data: {
          status: 'CANCELLED'
        }
      })

      if (deletedEmailAssignment.count === 0) {
        return NextResponse.json({ error: 'Email ataması bulunamadı' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Geçersiz atama türü' }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Atama başarıyla kaldırıldı'
    })

  } catch (error) {
    console.error('Project assignment removal error:', error)
    return NextResponse.json(
      { error: 'Atama kaldırma sırasında hata oluştu' },
      { status: 500 }
    )
  }
}