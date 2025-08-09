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

// Atamayı sil
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

    // Assignment'ı bul
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId }
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Atama bulunamadı' 
      }, { status: 404 })
    }

    // Sadece oluşturan kişi silebilir
    if (assignment.assignedBy !== userId) {
      return NextResponse.json({ 
        error: 'Bu atamayı silme yetkiniz yok' 
      }, { status: 403 })
    }

    // Atamayı sil
    await db.assignment.delete({
      where: { id: assignmentId }
    })

    return NextResponse.json({ 
      message: 'Atama başarıyla silindi' 
    })

  } catch (error) {
    console.error('Assignment deletion error:', error)
    return NextResponse.json(
      { error: 'Atama silinirken hata oluştu' },
      { status: 500 }
    )
  }
}