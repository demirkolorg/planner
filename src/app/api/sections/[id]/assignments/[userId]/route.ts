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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const { id: sectionId, userId: assigneeId } = await params
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    // Bölüm var mı ve kullanıcının atama kaldırma yetkisi var mı kontrol et
    const section = await db.section.findFirst({
      where: {
        id: sectionId,
        project: {
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
      }
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Bölüm bulunamadı veya atama kaldırma yetkiniz yok' },
        { status: 404 }
      )
    }

    // Mevcut atamayı kontrol et
    const existingAssignment = await db.sectionAssignment.findUnique({
      where: {
        sectionId_assigneeId: {
          sectionId,
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
    await db.sectionAssignment.delete({
      where: {
        sectionId_assigneeId: {
          sectionId,
          assigneeId
        }
      }
    })

    return NextResponse.json({
      message: 'Bölüm ataması başarıyla kaldırıldı'
    })

  } catch (error) {
    console.error('Remove section assignment error:', error)
    return NextResponse.json(
      { error: 'Bölüm ataması kaldırılırken hata oluştu' },
      { status: 500 }
    )
  }
}