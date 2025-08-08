import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { createProjectActivity, ProjectActivityTypes } from '@/lib/project-activity'

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id: projectId, userId: assigneeId } = await params
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    // Proje var mı ve kullanıcının atama kaldırma yetkisi var mı kontrol et
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: user.id }, // Proje sahibi
          { 
            members: {
              some: { 
                userId: user.id,
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          } // Yetki sahibi proje üyesi
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proje bulunamadı veya atama kaldırma yetkiniz yok' },
        { status: 404 }
      )
    }

    // Mevcut atamayı kontrol et
    const existingAssignment = await db.projectAssignment.findUnique({
      where: {
        projectId_assigneeId: {
          projectId,
          assigneeId
        }
      },
      include: {
        assignee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Atama bulunamadı' },
        { status: 404 }
      )
    }

    // Atamayı kaldır
    await db.projectAssignment.delete({
      where: {
        projectId_assigneeId: {
          projectId,
          assigneeId
        }
      }
    })

    // Activity oluştur
    await createProjectActivity({
      projectId,
      userId: user.id,
      actionType: ProjectActivityTypes.ASSIGNMENT_REMOVED,
      entityType: 'project',
      entityId: assigneeId,
      entityName: `${existingAssignment.assignee.firstName} ${existingAssignment.assignee.lastName}`,
      description: `${existingAssignment.assignee.firstName} ${existingAssignment.assignee.lastName} projeden çıkarıldı`
    })

    return NextResponse.json({
      message: 'Atama başarıyla kaldırıldı'
    })

  } catch (error) {
    console.error('Remove assignment error:', error)
    return NextResponse.json(
      { error: 'Atama kaldırılırken hata oluştu' },
      { status: 500 }
    )
  }
}