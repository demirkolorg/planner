import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notification-utils"
import { NotificationType } from "@prisma/client"

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
    const { action, message } = body // action: 'approve' veya 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 })
    }

    // Görev kontrolü ve yetki kontrolü
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        user: true, // Görev sahibi
        assignments: {
          include: {
            assignee: true
          }
        },
        approvalRequester: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 })
    }

    // Sadece görev sahibi onay verebilir/reddedebilir
    if (task.userId !== userId) {
      return NextResponse.json(
        { error: "Bu görevi onaylama/reddetme yetkiniz yok" },
        { status: 403 }
      )
    }

    // Onay bekliyor durumunda mı kontrol et
    if (task.approvalStatus !== 'PENDING') {
      return NextResponse.json(
        { error: "Bu görev onay bekliyor durumunda değil" },
        { status: 400 }
      )
    }

    let updatedTask

    if (action === 'approve') {
      // Onaylandı durumuna getir ve completed=true yap
      updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          approvalStatus: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          completed: true // Onaylandığında otomatik tamamlanır
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

      // Onay talep eden kişiye bildirim gönder
      if (task.approvalRequestedBy) {
        try {
          await createNotification({
            userId: task.approvalRequestedBy,
            title: "Görev Onaylandı",
            message: `"${task.title}" göreviniz onaylandı ve tamamlandı olarak işaretlendi`,
            type: NotificationType.TASK_STATUS_CHANGED,
            entityType: "task",
            entityId: taskId,
            actionUrl: `/tasks/${taskId}`,
            createdBy: userId,
            metadata: {
              taskId,
              taskTitle: task.title,
              action: 'approved',
              approverId: userId,
              approverName: task.user.firstName + " " + task.user.lastName
            }
          })
        } catch (notificationError) {
          console.error("Bildirim gönderilemedi:", notificationError)
        }
      }

    } else { // reject
      // Reddedildi durumuna getir
      updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          approvalStatus: 'REJECTED',
          approvedBy: userId,
          approvedAt: new Date()
          // completed durumu değişmez, false kalır
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

      // Onay talep eden kişiye bildirim gönder
      if (task.approvalRequestedBy) {
        try {
          await createNotification({
            userId: task.approvalRequestedBy,
            title: "Görev Reddedildi",
            message: `"${task.title}" göreviniz reddedildi. ${message ? 'Sebep: ' + message : 'Tekrar çalışmanız gerekiyor.'}`,
            type: NotificationType.TASK_STATUS_CHANGED,
            entityType: "task",
            entityId: taskId,
            actionUrl: `/tasks/${taskId}`,
            createdBy: userId,
            metadata: {
              taskId,
              taskTitle: task.title,
              action: 'rejected',
              rejectionMessage: message || '',
              approverId: userId,
              approverName: task.user.firstName + " " + task.user.lastName
            }
          })
        } catch (notificationError) {
          console.error("Bildirim gönderilemedi:", notificationError)
        }
      }
    }

    const actionText = action === 'approve' ? 'onaylandı' : 'reddedildi'
    
    return NextResponse.json({
      message: `Görev başarıyla ${actionText}`,
      task: updatedTask
    })

  } catch (error) {
    console.error("Onay işlemi sırasında hata:", error)
    return NextResponse.json(
      { error: "Onay işlemi sırasında hata oluştu" },
      { status: 500 }
    )
  }
}