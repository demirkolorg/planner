import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notification-utils"
import { NotificationType } from "@/generated/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const { id: taskId } = await params

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: "Onay mesajı gereklidir" }, { status: 400 })
    }

    // Görev kontrolü ve yetki kontrolü
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        user: true, // Görev sahibi
        assignments: {
          where: { assigneeId: userId }, // Bu kullanıcıya atanmış mı kontrol et
          include: {
            assignee: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 })
    }

    // Sadece atanmış kullanıcılar onay talep edebilir
    if (task.assignments.length === 0) {
      return NextResponse.json(
        { error: "Bu görevi onaya gönderme yetkiniz yok" },
        { status: 403 }
      )
    }

    // Görev sahibi kendi görevini onaya gönderemez
    if (task.userId === userId) {
      return NextResponse.json(
        { error: "Kendi görevinizi onaya gönderemezsiniz" },
        { status: 400 }
      )
    }

    // Zaten onay bekliyor mu kontrol et
    if (task.approvalStatus === 'PENDING') {
      return NextResponse.json(
        { error: "Bu görev zaten onay bekliyor" },
        { status: 400 }
      )
    }

    // Görev zaten tamamlandıysa onay talep edilemez
    if (task.completed) {
      return NextResponse.json(
        { error: "Tamamlanmış görev için onay talep edilemez" },
        { status: 400 }
      )
    }

    // Görevi onay bekliyor durumuna getir
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        approvalStatus: 'PENDING',
        approvalMessage: message.trim(),
        approvalRequestedBy: userId,
        approvalRequestedAt: new Date()
      },
      include: {
        user: true,
        assignments: {
          include: {
            assignee: true
          }
        }
      }
    })

    // Görev sahibine bildirim gönder
    try {
      const assigneeName = task.assignments[0]?.assignee.firstName + " " + task.assignments[0]?.assignee.lastName

      await createNotification({
        userId: task.userId, // Görev sahibine gönder
        title: "Onay Talebi",
        message: `${assigneeName} "${task.title}" görevini tamamladığını belirtti ve onayınızı bekliyor`,
        type: NotificationType.TASK_STATUS_CHANGED,
        entityType: "task",
        entityId: taskId,
        actionUrl: `/tasks/${taskId}`,
        createdBy: userId,
        metadata: {
          taskId,
          taskTitle: task.title,
          approvalMessage: message.trim(),
          requesterId: userId,
          requesterName: assigneeName
        }
      })
    } catch (notificationError) {
      console.error("Bildirim gönderilemedi:", notificationError)
      // Bildirim hatası görevin onaya gönderilmesini engellemez
    }

    return NextResponse.json({
      message: "Görev başarıyla onaya gönderildi",
      task: updatedTask
    })

  } catch (error) {
    console.error("Onay talebi gönderilirken hata:", error)
    return NextResponse.json(
      { error: "Onay talebi gönderilirken hata oluştu" },
      { status: 500 }
    )
  }
}