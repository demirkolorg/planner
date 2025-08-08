import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    })
    return user
  } catch (error) {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    // Görev var mı ve kullanıcının erişim yetkisi var mı kontrol et
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId: user.id }, // Görev sahibi
          {
            project: {
              OR: [
                { userId: user.id }, // Proje sahibi
                { 
                  members: {
                    some: { userId: user.id }
                  }
                }, // Proje üyesi
                {
                  assignments: {
                    some: { assigneeId: user.id }
                  }
                }, // Proje ataması olan
                {
                  sections: {
                    some: {
                      assignments: {
                        some: { assigneeId: user.id }
                      }
                    }
                  }
                } // Bölüm ataması olan
              ]
            }
          },
          {
            assignments: {
              some: { assigneeId: user.id }
            }
          } // Bu göreve atanmış
        ]
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            name: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Görev bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      )
    }

    // Görev atamalarını getir
    const userAssignments = await db.taskAssignment.findMany({
      where: { taskId },
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
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    // Email atamalarını getir
    const emailAssignments = await db.emailAssignment.findMany({
      where: {
        targetType: 'TASK',
        targetId: taskId,
        status: { in: ['PENDING', 'EXPIRED'] }
      },
      include: {
        assigner: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    // Response formatı
    const response = {
      userAssignments: userAssignments.map(assignment => ({
        id: assignment.assignee.id,
        firstName: assignment.assignee.firstName,
        lastName: assignment.assignee.lastName,
        email: assignment.assignee.email,
        assignedAt: assignment.assignedAt.toISOString(),
        assignedBy: assignment.assigner ? {
          firstName: assignment.assigner.firstName,
          lastName: assignment.assigner.lastName
        } : undefined
      })),
      emailAssignments: emailAssignments.map(assignment => ({
        id: assignment.id,
        email: assignment.email,
        assignedAt: assignment.assignedAt.toISOString(),
        expiresAt: assignment.expiresAt?.toISOString(),
        status: assignment.status,
        assignedBy: assignment.assigner ? {
          firstName: assignment.assigner.firstName,
          lastName: assignment.assigner.lastName
        } : undefined
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Task assignment list error:', error)
    return NextResponse.json(
      { error: 'Görev atama listesi alınırken hata oluştu' },
      { status: 500 }
    )
  }
}