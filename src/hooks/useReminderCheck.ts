import { useEffect, useRef, useCallback } from 'react'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationType, NotificationPriority } from '@/types/notification'

interface ReminderCheckOptions {
  enabled?: boolean
  intervalMs?: number
}

export function useReminderCheck(options: ReminderCheckOptions = {}) {
  const { enabled = true, intervalMs = 60 * 60 * 1000 } = options // Default: 1 saat
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { addNotification } = useNotificationStore()

  const checkReminders = useCallback(async () => {
    try {
      console.log('Hatırlatıcılar kontrol ediliyor...', new Date())
      
      const response = await fetch('/api/reminders/check')
      
      if (!response.ok) {
        throw new Error('Hatırlatıcı kontrolü başarısız')
      }
      
      const result = await response.json()
      
      if (result.pendingReminders && result.pendingReminders.length > 0) {
        console.log(`${result.pendingReminders.length} hatırlatıcı bulundu`)
        
        // Her hatırlatıcı için sadece in-app bildirim oluştur
        for (const reminder of result.pendingReminders) {
          await addNotification({
            type: NotificationType.REMINDER,
            title: `Hatırlatıcı: ${reminder.task.title}`,
            message: reminder.message || `${reminder.task.title} görevi için hatırlatıcı zamanı geldi.`,
            priority: NotificationPriority.HIGH,
            taskId: reminder.taskId,
            reminderId: reminder.id,
            metadata: {
              reminderDatetime: reminder.datetime,
              taskDescription: reminder.task.description
            }
          })
        }
      }
    } catch (error) {
      console.error('Hatırlatıcı kontrolünde hata:', error)
    }
  }, [addNotification])

  useEffect(() => {
    if (!enabled) {
      return
    }

    // İlk kontrol
    checkReminders()

    // Düzenli kontroller için interval
    intervalRef.current = setInterval(checkReminders, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, intervalMs, checkReminders])

  // Manuel kontrol fonksiyonu
  const manualCheck = () => {
    checkReminders()
  }

  return {
    manualCheck
  }
}

// Tarayıcı tab'ı odağa geldiğinde kontrol etmek için hook
export function useReminderCheckOnFocus() {
  const { manualCheck } = useReminderCheck({ enabled: false })

  useEffect(() => {
    const handleFocus = () => {
      // Tab odağa geldiğinde hatırlatıcıları kontrol et
      manualCheck()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Sayfa görünür hale geldiğinde kontrol et
        manualCheck()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [manualCheck])
}