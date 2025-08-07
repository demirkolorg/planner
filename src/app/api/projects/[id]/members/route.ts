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
    return decoded.userId
  } catch {
    return null
  }
}

// Proje üyelerini listele
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Proje erişimi kontrolü
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId }, // Proje sahibi
          {
            members: {
              some: { userId: userId } // Proje üyesi
            }
          }
        ]
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı veya erişim yetkiniz yok' }, { status: 404 })
    }

    // Proje sahibini ve üyeleri birleştir
    const members = [
      {
        id: 'owner',
        userId: project.user.id,
        projectId: project.id,
        role: 'OWNER' as const,
        createdAt: project.createdAt,
        addedBy: project.user.id,
        user: project.user
      },
      ...project.members
    ]

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Project members listing error:', error)
    return NextResponse.json(
      { error: 'Proje üyeleri listelenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Proje üyesi ekle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const { userIds, role = 'MEMBER' } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'UserIds is required' }, { status: 400 })
    }

    // Proje sahibi olup olmama kontrolü
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId }, // Proje sahibi
          {
            members: {
              some: {
                userId: userId,
                role: 'OWNER' // Sadece OWNER yetkisi olanlar üye ekleyebilir
              }
            }
          }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proje bulunamadı veya üye ekleme yetkiniz yok' },
        { status: 404 }
      )
    }

    // Kullanıcıların var olup olmadığını kontrol et
    const users = await db.user.findMany({
      where: {
        id: { in: userIds }
      }
    })

    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'Bazı kullanıcılar bulunamadı' }, { status: 404 })
    }

    // Zaten üye olanları kontrol et
    const existingMembers = await db.projectMember.findMany({
      where: {
        projectId,
        userId: { in: userIds }
      }
    })

    const existingUserIds = existingMembers.map(m => m.userId)
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id))

    if (newUserIds.length === 0) {
      return NextResponse.json({ error: 'Tüm kullanıcılar zaten proje üyesi' }, { status: 400 })
    }

    // Yeni üyeleri ekle
    const newMembers = await db.projectMember.createMany({
      data: newUserIds.map(id => ({
        projectId,
        userId: id,
        role,
        addedBy: userId
      }))
    })

    return NextResponse.json({
      message: `${newMembers.count} üye başarıyla eklendi`,
      addedCount: newMembers.count
    })
  } catch (error) {
    console.error('Project member addition error:', error)
    return NextResponse.json(
      { error: 'Üye ekleme sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

// Proje üyesini kaldır
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthenticatedUser()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const memberUserId = searchParams.get('userId')

    if (!memberUserId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
    }

    // Proje sahibi olup olmama kontrolü
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId }, // Proje sahibi
          {
            members: {
              some: {
                userId: userId,
                role: 'OWNER' // Sadece OWNER yetkisi olanlar üye kaldırabilir
              }
            }
          }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proje bulunamadı veya üye kaldırma yetkiniz yok' },
        { status: 404 }
      )
    }

    // Proje sahibini kaldırmaya çalışma kontrolü
    if (project.userId === memberUserId) {
      return NextResponse.json(
        { error: 'Proje sahibi kaldırılamaz' },
        { status: 400 }
      )
    }

    // Üyeyi kaldır
    const deletedMember = await db.projectMember.deleteMany({
      where: {
        projectId,
        userId: memberUserId
      }
    })

    if (deletedMember.count === 0) {
      return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Üye başarıyla kaldırıldı'
    })
  } catch (error) {
    console.error('Project member removal error:', error)
    return NextResponse.json(
      { error: 'Üye kaldırma sırasında hata oluştu' },
      { status: 500 }
    )
  }
}