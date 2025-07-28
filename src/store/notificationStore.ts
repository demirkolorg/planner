import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  NotificationStore, 
  InAppNotification, 
  NotificationPayload, 
  NotificationType 
} from '@/types/notification'

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      // Actions
      fetchNotifications: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/notifications')
          
          if (!response.ok) {
            throw new Error('Bildirimler alınamadı')
          }
          
          const notifications: InAppNotification[] = await response.json()
          const unreadCount = notifications.filter(n => !n.isRead).length
          
          set({
            notifications,
            unreadCount,
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            isLoading: false
          })
        }
      },

      addNotification: async (payload: NotificationPayload) => {
        try {
          const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })
          
          if (!response.ok) {
            throw new Error('Bildirim eklenemedi')
          }
          
          const newNotification: InAppNotification = await response.json()
          
          set(state => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bildirim eklenirken hata oluştu'
          })
        }
      },

      markAsRead: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH'
          })
          
          if (!response.ok) {
            throw new Error('Bildirim okundu olarak işaretlenemedi')
          }
          
          set(state => ({
            notifications: state.notifications.map(notification =>
              notification.id === id 
                ? { ...notification, isRead: true }
                : notification
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bildirim işaretlenirken hata oluştu'
          })
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await fetch('/api/notifications/read-all', {
            method: 'PATCH'
          })
          
          if (!response.ok) {
            throw new Error('Tüm bildirimler okundu olarak işaretlenemedi')
          }
          
          set(state => ({
            notifications: state.notifications.map(notification => ({
              ...notification,
              isRead: true
            })),
            unreadCount: 0
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bildirimler işaretlenirken hata oluştu'
          })
        }
      },

      deleteNotification: async (id: string) => {
        try {
          const response = await fetch(`/api/notifications/${id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            throw new Error('Bildirim silinemedi')
          }
          
          set(state => {
            const notification = state.notifications.find(n => n.id === id)
            const wasUnread = notification && !notification.isRead
            
            return {
              notifications: state.notifications.filter(n => n.id !== id),
              unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
            }
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bildirim silinirken hata oluştu'
          })
        }
      },

      clearAll: async () => {
        try {
          const response = await fetch('/api/notifications', {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            throw new Error('Tüm bildirimler temizlenemedi')
          }
          
          set({
            notifications: [],
            unreadCount: 0
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Bildirimler temizlenirken hata oluştu'
          })
        }
      },

      // Selectors
      getUnreadNotifications: () => {
        return get().notifications.filter(notification => !notification.isRead)
      },

      getNotificationsByType: (type: NotificationType) => {
        return get().notifications.filter(notification => notification.type === type)
      },

      // State setters
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      }
    }),
    {
      name: 'notification-store'
    }
  )
)