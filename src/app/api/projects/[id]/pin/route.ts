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

    // Check if user has access to this project
    // Not: Access control check ekleyeceğiz - user projenin sahibi veya assigned olmalı
    const hasAccess = await db.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId }, // Owner
          { 
            // Assigned project
            id: {
              in: (await db.assignment.findMany({
                where: {
                  targetType: 'PROJECT',
                  targetId: projectId,
                  userId: userId,
                  status: 'ACTIVE'
                },
                select: { targetId: true }
              })).map(a => a.targetId)
            }
          }
        ]
      }
    })

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Projeye erişim yetkiniz yok' },
        { status: 403 }
      )
    }

    // Check current pin status for this user
    const existingPin = await db.userPin.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: userId,
          targetType: 'PROJECT',
          targetId: projectId
        }
      }
    })

    // Toggle pin status
    const newPinStatus = !existingPin
    if (newPinStatus) {
      // Pin the project
      await db.userPin.create({
        data: {
          userId: userId,
          targetType: 'PROJECT',
          targetId: projectId
        }
      })
    } else {
      // Unpin the project
      await db.userPin.delete({
        where: {
          userId_targetType_targetId: {
            userId: userId,
            targetType: 'PROJECT',
            targetId: projectId
          }
        }
      })
    }

    // Get updated project
    const updatedProject = await db.project.findUnique({
      where: { id: projectId }
    })

    return NextResponse.json({
      success: true,
      message: newPinStatus ? 'Proje sabitlendi' : 'Proje sabitleme kaldırıldı',
      project: {
        ...updatedProject,
        isPinned: newPinStatus
      }
    })

  } catch (error) {
    console.error('Proje sabitleme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Proje sabitleme işlemi başarısız' },
      { status: 500 }
    )
  }
}