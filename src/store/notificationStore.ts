import { create } from "zustand"
import { persist } from "zustand/middleware"

// Notification types
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  entityType?: string
  entityId?: string
  actionUrl?: string
  isRead: boolean
  createdBy?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface NotificationSettings {
  id: string
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  taskAssignment: boolean
  taskComments: boolean
  taskStatusChanges: boolean
  projectUpdates: boolean
  mentionsOnly: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchNotifications: (options?: { unreadOnly?: boolean; limit?: number; offset?: number }) => Promise<void>
  fetchSettings: () => Promise<void>
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteSelected: (notificationIds: string[]) => Promise<void>
  deleteAllRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  updateUnreadCount: (count: number) => void
  clearError: () => void
  resetStore: () => void
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: null,
  isLoading: false,
  error: null
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchNotifications: async (options = {}) => {
        const { unreadOnly = false, limit = 20, offset = 0 } = options
        
        set({ isLoading: true, error: null })
        
        try {
          const params = new URLSearchParams({
            unreadOnly: unreadOnly.toString(),
            limit: limit.toString(),
            offset: offset.toString()
          })

          const response = await fetch(`/api/notifications?${params}`)
          
          if (!response.ok) {
            throw new Error("Bildirimler getirilemedi")
          }

          const data = await response.json()
          
          set({
            notifications: offset === 0 ? data.notifications : [...get().notifications, ...data.notifications],
            unreadCount: data.unreadCount,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bilinmeyen hata",
            isLoading: false
          })
        }
      },

      fetchSettings: async () => {
        try {
          const response = await fetch("/api/notifications/settings")
          
          if (!response.ok) {
            throw new Error("Ayarlar getirilemedi")
          }

          const settings = await response.json()
          set({ settings })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Ayarlar getirilemedi"
          })
        }
      },

      updateSettings: async (newSettings) => {
        try {
          const response = await fetch("/api/notifications/settings", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(newSettings)
          })

          if (!response.ok) {
            throw new Error("Ayarlar güncellenemedi")
          }

          const updatedSettings = await response.json()
          set({ settings: updatedSettings })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Ayarlar güncellenemedi"
          })
        }
      },

      markAsRead: async (notificationId) => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ isRead: true })
          })

          if (!response.ok) {
            throw new Error("Bildirim güncellenemedi")
          }

          // Store'u güncelle
          set((state) => ({
            notifications: state.notifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bildirim güncellenemedi"
          })
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await fetch("/api/notifications/bulk", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: "mark_all_read" })
          })

          if (!response.ok) {
            throw new Error("Bildirimler güncellenemedi")
          }

          const data = await response.json()

          // Store'u güncelle
          set((state) => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              isRead: true
            })),
            unreadCount: 0
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bildirimler güncellenemedi"
          })
        }
      },

      deleteNotification: async (notificationId) => {
        try {
          const response = await fetch(`/api/notifications/${notificationId}`, {
            method: "DELETE"
          })

          if (!response.ok) {
            throw new Error("Bildirim silinemedi")
          }

          // Store'dan kaldır
          set((state) => {
            const notification = state.notifications.find(n => n.id === notificationId)
            const newUnreadCount = notification && !notification.isRead 
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount

            return {
              notifications: state.notifications.filter(n => n.id !== notificationId),
              unreadCount: newUnreadCount
            }
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bildirim silinemedi"
          })
        }
      },

      deleteSelected: async (notificationIds) => {
        try {
          const response = await fetch("/api/notifications/bulk", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "delete_selected",
              notificationIds
            })
          })

          if (!response.ok) {
            throw new Error("Bildirimler silinemedi")
          }

          const data = await response.json()

          // Store'dan kaldır
          set((state) => ({
            notifications: state.notifications.filter(n => !notificationIds.includes(n.id)),
            unreadCount: data.unreadCount
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Bildirimler silinemedi"
          })
        }
      },

      deleteAllRead: async () => {
        try {
          const response = await fetch("/api/notifications/bulk", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ action: "delete_all_read" })
          })

          if (!response.ok) {
            throw new Error("Okunmuş bildirimler silinemedi")
          }

          // Store'dan okunmuş bildirimleri kaldır
          set((state) => ({
            notifications: state.notifications.filter(n => !n.isRead)
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Okunmuş bildirimler silinemedi"
          })
        }
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }))
      },

      updateUnreadCount: (count) => {
        set({ unreadCount: count })
      },

      clearError: () => {
        set({ error: null })
      },

      resetStore: () => {
        set(initialState)
      }
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
)