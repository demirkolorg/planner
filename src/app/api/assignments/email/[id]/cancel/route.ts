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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      )
    }

    // Email assignment'ı bul
    const emailAssignment = await db.emailAssignment.findUnique({
      where: { id: assignmentId }
    })

    if (!emailAssignment) {
      return NextResponse.json(
        { error: 'Email ataması bulunamadı' },
        { status: 404 }
      )
    }

    // Kullanıcının iptal etme yetkisi var mı kontrol et
    if (emailAssignment.targetType === 'PROJECT') {
      const project = await db.project.findFirst({
        where: {
          id: emailAssignment.targetId,
          OR: [
            { userId: user.id }, // Proje sahibi
            { 
              members: {
                some: { 
                  userId: user.id,
                  role: { in: ['OWNER', 'ADMIN'] }
                }
              }
            }, // Yetki sahibi proje üyesi
            { assignments: { some: { assigneeId: user.id } } } // Atanan kullanıcı kendisinin atamasını iptal edebilir
          ]
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Bu email atamasını iptal etme yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    // Email assignment'ı iptal et
    await db.emailAssignment.update({
      where: { id: assignmentId },
      data: { 
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({
      message: 'Email ataması başarıyla iptal edildi'
    })

  } catch (error) {
    console.error('Cancel email assignment error:', error)
    return NextResponse.json(
      { error: 'Email ataması iptal edilirken hata oluştu' },
      { status: 500 }
    )
  }
}