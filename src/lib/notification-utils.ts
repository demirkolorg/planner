import { db } from "@/lib/db"
import { NotificationType } from "@prisma/client"

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
  userId: string, 
  assignedBy: string,
  taskTitle: string
) {
  const assigner = await db.user.findUnique({
    where: { id: assignedBy },
    select: { firstName: true, lastName: true }
  })

  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}` : `/tasks/${taskId}`

  return createNotification({
    userId: userId,
    title: "Yeni Görev Ataması",
    message: `${assigner?.firstName} ${assigner?.lastName} size "${taskTitle}" görevini atadı`,
    type: NotificationType.TASK_ASSIGNED,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    createdBy: assignedBy,
    metadata: {
      taskId,
      taskTitle,
      assignedBy: assignedBy,
      assignerName: `${assigner?.firstName} ${assigner?.lastName}`,
      projectId: task?.projectId
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

  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}#comments` : `/tasks/${taskId}#comments`

  return createNotification({
    userId: taskOwnerId,
    title: "Yeni Yorum",
    message: `${author?.firstName} ${author?.lastName} "${taskTitle}" görevine yorum yaptı`,
    type: NotificationType.TASK_COMMENT,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    createdBy: commentAuthorId,
    metadata: {
      taskId,
      taskTitle,
      commentContent: commentContent.substring(0, 100) + (commentContent.length > 100 ? "..." : ""),
      authorId: commentAuthorId,
      authorName: `${author?.firstName} ${author?.lastName}`,
      projectId: task?.projectId
    }
  })
}

// Görev durumu değişikliği bildirimi
export async function createTaskStatusChangeNotification(
  taskId: string,
  userId: string,
  changedBy: string,
  taskTitle: string,
  newStatus: boolean // completed durumu
) {
  // Değiştiren kişi atanan kişi ise bildirim gönderme
  if (changedBy === userId) return null

  const changer = await db.user.findUnique({
    where: { id: changedBy },
    select: { firstName: true, lastName: true }
  })

  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const statusText = newStatus ? "tamamlandı" : "yeniden açıldı"
  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}` : `/tasks/${taskId}`

  return createNotification({
    userId: userId,
    title: "Görev Durumu Değişti",
    message: `${changer?.firstName} ${changer?.lastName} "${taskTitle}" görevini ${statusText} olarak işaretledi`,
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    createdBy: changedBy,
    metadata: {
      taskId,
      taskTitle,
      newStatus,
      changerId: changedBy,
      changerName: `${changer?.firstName} ${changer?.lastName}`,
      projectId: task?.projectId
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

// Atama bildirimleri (proje, bölüm, görev ataması)
export async function createAssignmentNotification(
  targetType: 'PROJECT' | 'SECTION' | 'TASK',
  targetId: string,
  targetName: string,
  userId: string,
  assignedBy: string
) {
  const assigner = await db.user.findUnique({
    where: { id: assignedBy },
    select: { firstName: true, lastName: true }
  })

  let projectId: string | null = null
  let actionUrl = '/'

  if (targetType === 'PROJECT') {
    projectId = targetId
    actionUrl = `/projects/${targetId}`
  } else if (targetType === 'SECTION') {
    // Bölümün proje ID'sini bul
    const section = await db.section.findUnique({
      where: { id: targetId },
      select: { projectId: true }
    })
    projectId = section?.projectId || null
    actionUrl = projectId ? `/projects/${projectId}` : '/'
  } else if (targetType === 'TASK') {
    // Görevin proje ID'sini bul
    const task = await db.task.findUnique({
      where: { id: targetId },
      select: { projectId: true }
    })
    projectId = task?.projectId || null
    actionUrl = projectId ? `/projects/${projectId}?highlight=${targetId}` : '/'
  }

  const typeText = targetType === 'PROJECT' ? 'Proje' : 
                   targetType === 'SECTION' ? 'Bölüm' : 'Görev'

  return createNotification({
    userId: userId,
    title: `Yeni ${typeText} Ataması`,
    message: `${assigner?.firstName} ${assigner?.lastName} sizi "${targetName}" ${typeText.toLowerCase()}una atadı`,
    type: NotificationType.TASK_ASSIGNED,
    entityType: targetType.toLowerCase(),
    entityId: targetId,
    actionUrl: actionUrl,
    createdBy: assignedBy,
    metadata: {
      targetType,
      targetId,
      targetName,
      assignedBy: assignedBy,
      assignerName: `${assigner?.firstName} ${assigner?.lastName}`,
      projectId
    }
  })
}

// Onay talebi bildirimi
export async function createApprovalRequestNotification(
  taskId: string,
  taskTitle: string,
  requestedBy: string,
  taskOwnerId: string,
  message?: string
) {
  // Talep eden kişi task sahibi ise bildirim gönderme
  if (requestedBy === taskOwnerId) return null

  const requester = await db.user.findUnique({
    where: { id: requestedBy },
    select: { firstName: true, lastName: true }
  })

  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}` : `/tasks/${taskId}`

  return createNotification({
    userId: taskOwnerId,
    title: "Yeni Onay Talebi",
    message: `${requester?.firstName} ${requester?.lastName} "${taskTitle}" görevini onayınıza sundu`,
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    createdBy: requestedBy,
    metadata: {
      taskId,
      taskTitle,
      requesterId: requestedBy,
      requesterName: `${requester?.firstName} ${requester?.lastName}`,
      approvalMessage: message,
      projectId: task?.projectId
    }
  })
}

// Onay cevabı bildirimi
export async function createApprovalResponseNotification(
  taskId: string,
  taskTitle: string,
  respondedBy: string,
  requestedBy: string,
  approved: boolean,
  responseMessage?: string
) {
  // Cevap veren kişi talep eden ise bildirim gönderme
  if (respondedBy === requestedBy) return null

  const responder = await db.user.findUnique({
    where: { id: respondedBy },
    select: { firstName: true, lastName: true }
  })

  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}` : `/tasks/${taskId}`
  const statusText = approved ? "onaylandı" : "reddedildi"

  return createNotification({
    userId: requestedBy,
    title: approved ? "Görev Onaylandı" : "Görev Reddedildi",
    message: `${responder?.firstName} ${responder?.lastName} "${taskTitle}" görevini ${statusText}`,
    type: NotificationType.TASK_STATUS_CHANGED,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    createdBy: respondedBy,
    metadata: {
      taskId,
      taskTitle,
      responderId: respondedBy,
      responderName: `${responder?.firstName} ${responder?.lastName}`,
      approved,
      responseMessage,
      projectId: task?.projectId
    }
  })
}

// Tarih yaklaşma bildirimi
export async function createDueDateNotification(
  taskId: string,
  taskTitle: string,
  userId: string,
  dueDate: Date,
  isOverdue: boolean = false
) {
  // Görevin proje ID'sini bul
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  })

  const actionUrl = task?.projectId ? `/projects/${task.projectId}?highlight=${taskId}` : `/tasks/${taskId}`
  
  const title = isOverdue ? "Görev Süresi Geçti" : "Görev Teslim Tarihi Yaklaştı"
  const message = isOverdue 
    ? `"${taskTitle}" görevinin teslim süresi geçti`
    : `"${taskTitle}" görevinin teslim tarihi yaklaştı`

  return createNotification({
    userId: userId,
    title: title,
    message: message,
    type: NotificationType.TASK_DUE_SOON,
    entityType: "task",
    entityId: taskId,
    actionUrl: actionUrl,
    metadata: {
      taskId,
      taskTitle,
      dueDate: dueDate.toISOString(),
      isOverdue,
      projectId: task?.projectId
    }
  })
}