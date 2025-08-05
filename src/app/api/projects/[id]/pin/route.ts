import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT token'dan user ID'yi al
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId
    const { id: projectId } = await params

    // Request body'den isPinned değerini al
    const { isPinned } = await request.json()

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isPinned değeri boolean olmalıdır' },
        { status: 400 }
      )
    }

    // Projeyi bul ve sahipliğini kontrol et
    const project = await db.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Proje bulunamadı' },
        { status: 404 }
      )
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Bu projeyi sabitleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // Projeyi güncelle
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: { isPinned }
    })

    return NextResponse.json({
      success: true,
      message: isPinned ? 'Proje sabitlendi' : 'Proje sabitleme kaldırıldı',
      project: updatedProject
    })

  } catch (error) {
    console.error('Proje sabitleme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Proje sabitleme işlemi başarısız' },
      { status: 500 }
    )
  }
}