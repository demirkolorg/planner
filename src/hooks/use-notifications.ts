"use client"

import { useEffect, useRef, useCallback } from "react"
import { useNotificationStore } from "@/store/notificationStore"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

// EventSource sadece client-side'da mevcut
const isClient = typeof window !== 'undefined'

export function useNotifications() {
  const { isAuthenticated } = useAuthStore()
  const { addNotification, updateUnreadCount, fetchNotifications } = useNotificationStore()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connectToStream = useCallback(() => {
    if (!isAuthenticated || !isClient) return

    // Mevcut bağlantıyı kapat
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    try {
      const eventSource = new EventSource("/api/notifications/stream")
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("Notification stream connected")
        reconnectAttempts.current = 0
        
        // İlk bağlantıda mevcut bildirimleri yükle
        fetchNotifications()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case "connected":
              console.log("Bildirim akışına bağlandı:", data.message)
              break

            case "notification":
              // Yeni bildirim geldi
              addNotification(data.data)
              
              // Toast bildirimi göster
              toast.success(data.data.title, {
                description: data.data.message,
                action: data.data.actionUrl ? {
                  label: "Görüntüle",
                  onClick: () => {
                    window.location.href = data.data.actionUrl
                  }
                } : undefined
              })
              break

            case "unread_count":
              // Okunmamış sayısı güncellendi
              updateUnreadCount(data.data.unreadCount)
              break

            case "heartbeat":
              // Heartbeat - bağlantı canlı
              break

            default:
              console.log("Bilinmeyen notification event:", data)
          }
        } catch (error) {
          console.error("Notification event parse error:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("Notification stream error:", error)
        
        eventSource.close()
        eventSourceRef.current = null

        // Yeniden bağlanma dene
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(5000 * Math.pow(2, reconnectAttempts.current), 60000) // 5s, 10s, 20s, 40s, 60s
          
          console.log(`Notification stream reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToStream()
          }, delay)
        } else {
          console.error("Max reconnection attempts reached for notification stream")
          toast.error("Bildirim bağlantısı kesildi", {
            description: "Sayfayı yenilemek gerekebilir"
          })
        }
      }

    } catch (error) {
      console.error("Failed to create notification stream:", error)
    }
  }, [isAuthenticated, addNotification, updateUnreadCount, fetchNotifications])

  const disconnectFromStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    reconnectAttempts.current = 0
  }, [])

  // Kimlik doğrulama durumuna göre bağlantıyı yönet
  useEffect(() => {
    if (isAuthenticated) {
      connectToStream()
    } else {
      disconnectFromStream()
    }

    return disconnectFromStream
  }, [isAuthenticated, connectToStream, disconnectFromStream])

  // Sayfa kapanırken bağlantıyı kapat
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnectFromStream()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      disconnectFromStream()
    }
  }, [disconnectFromStream])

  // Sayfa görünürlüğüne göre bağlantıyı yönet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isAuthenticated) return

      if (document.hidden) {
        // Sayfa gizlendi - bağlantıyı kapat
        disconnectFromStream()
      } else {
        // Sayfa görünür oldu - bağlantıyı yeniden kur
        connectToStream()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAuthenticated, connectToStream, disconnectFromStream])

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connectToStream,
    disconnect: disconnectFromStream
  }
}

// Auto-connect hook - layout'ta kullanmak için
export function useAutoNotifications() {
  // Sadece client-side'da çalış
  useEffect(() => {
    if (!isClient) return
    
    // Client-side'da notification hook'unu başlat
    const { isAuthenticated } = useAuthStore.getState()
    const { addNotification, updateUnreadCount, fetchNotifications } = useNotificationStore.getState()
    
    if (!isAuthenticated) return
    
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    
    const connectToStream = () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      
      try {
        eventSource = new EventSource("/api/notifications/stream")
        
        eventSource.onopen = () => {
          console.log("Notification stream connected")
          reconnectAttempts = 0
          fetchNotifications()
        }
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            switch (data.type) {
              case "notification":
                addNotification(data.data)
                break
              case "unread_count":
                updateUnreadCount(data.data.unreadCount)
                break
            }
          } catch (error) {
            console.error("Notification event parse error:", error)
          }
        }
        
        eventSource.onerror = () => {
          eventSource?.close()
          eventSource = null
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000) // 5s, 10s, 20s, 40s, 60s
            reconnectTimeout = setTimeout(connectToStream, delay)
          }
        }
      } catch (error) {
        console.error("Failed to create notification stream:", error)
      }
    }
    
    connectToStream()
    
    return () => {
      if (eventSource) {
        eventSource.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [])
  
  return null
}