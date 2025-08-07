import { db } from "@/lib/db"
import { NotificationType } from "@/generated/prisma"

// Bildirim gönderme fonksiyonu helper'ı
export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  entityType?: string
  entityId?: string
  actionUrl?: string
  createdBy?: string
  metadata?: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Kullanıcının bildirim ayarlarını kontrol et
    const settings = await db.notificationSettings.findUnique({
      where: { userId: params.userId }
    })

    // Ayarlar yoksa varsayılan olarak bildirimi gönder
    if (settings) {
      // Bildirim türüne göre ayarları kontrol et
      switch (params.type) {
        case NotificationType.TASK_ASSIGNED:
          if (!settings.taskAssignment) return null
          break
        case NotificationType.TASK_COMMENT:
          if (!settings.taskComments) return null
          break
        case NotificationType.TASK_STATUS_CHANGED:
          if (!settings.taskStatusChanges) return null
          break
        case NotificationType.PROJECT_UPDATE:
        case NotificationType.PROJECT_INVITE:
          if (!settings.projectUpdates) return null
          break
        default:
          break
      }
    }

    // Bildirimi oluştur
    const notification = await db.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        actionUrl: params.actionUrl,
        createdBy: params.createdBy,
        metadata: params.metadata
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Real-time bildirim gönder (SSE kullanarak)
    try {
      // Bu fonksiyonu dynamic import ile çağıracağız
      const { sendNotificationToUser, sendUnreadCountUpdate } = await import("@/app/api/notifications/stream/route")
      
      // Bildirim gönder
      sendNotificationToUser(params.userId, notification)
      
      // Okunmamış sayısını güncelle
      const unreadCount = await db.notification.count({
        where: {
          userId: params.userId,
          isRead: false
        }
      })
      
      sendUnreadCountUpdate(params.userId, unreadCount)
    } catch (sseError) {
      // SSE hatası önemli değil, bildirim veritabanında kayıtlı
      console.log("SSE bildirim gönderilemedi:", sseError)
    }

    return notification

  } catch (error) {
    console.error("Bildirim oluşturulurken hata:", error)
    throw error
  }
}

// Görev ataması bildirimi
export async function createTaskAssignmentNotification(
  taskId: string, 
  assigneeId: string, 
  assignedBy: string,
  taskTitle: string
) {
  const assigner = await db.user.findUnique({
    where: { id: assignedBy },
    select: { firstName: true, lastName: true }
  })

  return createNotification({
    userId: assigneeId,
    title: "Yeni Görev Ataması",
    message: `${assigner?.firstName} ${assigner?.lastName} size "${taskTitle}" görevini atadı`,
    type: NotificationType.TASK_ASSIGNED,
    entityType: "task",
    entityId: taskId,
    actionUrl: `/tasks/${taskId}`,
    createdBy: assignedBy,
    metadata: {
      taskId,
      taskTitle,
      assignerId: assignedBy,
      assignerName: `${assigner?.firstName} ${assigner?.lastName}`
    }
  })
}

// Yorum bildirimi
export async function createCommentNotification(
  taskId: string,
  commentAuthorId: string,
  taskOwnerId: string,
  taskTitle: string,
  commentContent: string
) {
  // Yorum yapan kişi görevi sahibi ise bildirim gönderme
  if (commentAuthorId === taskOwnerId) return null

  const author = await db.user.findUnique({
    where: { id: commentAuthorId },
    select: { firstName: true, lastName: true }
  })

  return createNotification({
    userId: taskOwnerId,
    title: "Yeni Yorum",
    message: `${author?.firstName} ${author?.lastName} "${taskTitle}" görevine yorum yaptı`,
    type: NotificationType.TASK_COMMENT,
    entityType: "task",
    entityId: taskId,
    actionUrl: `/tasks/${taskId}#comments`,
    createdBy: commentAuthorId,
    metadata: {
      taskId,
      taskTitle,
      commentContent: commentContent.substring(0, 100) + (commentContent.length > 100 ? "..." : ""),
      authorId: commentAuthorId,
      authorName: `${author?.firstName} ${author?.lastName}`
    }
  })
}

// Görev durumu değişikliği bildirimi
export async function createTaskStatusChangeNotification(
  taskId: string,
  assigneeId: string,
  changedBy: string,
  taskTitle: string,
  newStatus: boolean // completed durumu
) {
  // Değiştiren kişi atanan kişi ise bildirim gönderme
  if (changedBy === assigneeId) return null

  const changer = await db.user.findUnique({
    where: { id: changedBy },
    select: { firstName: true, lastName: true }
  })

  const statusText = newStatus ? "tamamlandı" : "yeniden açıldı"

  return createNotification({
    userId: assigneeId,
    title: "Görev Durumu Değişti",
    message: `${changer?.firstName} ${changer?.lastName} "${taskTitle}" görevini ${statusText} olarak işaretledi`,
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: "task",
    entityId: taskId,
    actionUrl: `/tasks/${taskId}`,
    createdBy: changedBy,
    metadata: {
      taskId,
      taskTitle,
      newStatus,
      changerId: changedBy,
      changerName: `${changer?.firstName} ${changer?.lastName}`
    }
  })
}

// Proje davet bildirimi
export async function createProjectInviteNotification(
  projectId: string,
  invitedUserId: string,
  invitedBy: string,
  projectName: string
) {
  const inviter = await db.user.findUnique({
    where: { id: invitedBy },
    select: { firstName: true, lastName: true }
  })

  return createNotification({
    userId: invitedUserId,
    title: "Proje Daveti",
    message: `${inviter?.firstName} ${inviter?.lastName} sizi "${projectName}" projesine davet etti`,
    type: NotificationType.PROJECT_INVITE,
    entityType: "project",
    entityId: projectId,
    actionUrl: `/projects/${projectId}`,
    createdBy: invitedBy,
    metadata: {
      projectId,
      projectName,
      inviterId: invitedBy,
      inviterName: `${inviter?.firstName} ${inviter?.lastName}`
    }
  })
}