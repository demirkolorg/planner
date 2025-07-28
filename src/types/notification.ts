// Bildirim türleri ve arayüzleri

export enum NotificationType {
  REMINDER = 'REMINDER',
  TASK_DUE = 'TASK_DUE',
  TASK_OVERDUE = 'TASK_OVERDUE',
  SYSTEM = 'SYSTEM'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface InAppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  isRead: boolean
  createdAt: Date
  updatedAt: Date
  // İlişkili veri
  taskId?: string
  reminderId?: string
  // Ek meta data
  metadata?: Record<string, unknown>
}

export interface NotificationPayload {
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  taskId?: string
  reminderId?: string
  metadata?: Record<string, unknown>
}

export interface NotificationState {
  notifications: InAppNotification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
}

export interface NotificationStore extends NotificationState {
  // Actions
  fetchNotifications: () => Promise<void>
  addNotification: (payload: NotificationPayload) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  
  // Selectors
  getUnreadNotifications: () => InAppNotification[]
  getNotificationsByType: (type: NotificationType) => InAppNotification[]
  
  // State setters
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}


// Reminder kontrol için interface
export interface ReminderCheckResult {
  pendingReminders: Array<{
    id: string
    taskId: string
    datetime: Date
    message?: string
    task: {
      id: string
      title: string
      description?: string
    }
  }>
  processedCount: number
}