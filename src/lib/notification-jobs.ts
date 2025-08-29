/**
 * Bildirim job'larını manuel olarak tetiklemek için yardımcı fonksiyonlar
 */

export async function triggerDueDateCheck() {
  try {
    const response = await fetch('/api/notifications/due-date-check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer default-cron-secret`, // Admin panel'den çağrıldığında basit token
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`)
    }

    return result
  } catch (error) {
    console.error('Due date check trigger error:', error)
    throw error
  }
}

export async function getDueDateCheckStatus() {
  try {
    const response = await fetch('/api/notifications/due-date-check', {
      method: 'GET'
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`)
    }

    return result
  } catch (error) {
    console.error('Due date check status error:', error)
    throw error
  }
}

/**
 * Cron job formatında zamanlamalar
 * Bu fonksiyonlar production'da gerçek cron job veya scheduled task olarak kullanılabilir
 */
export const NOTIFICATION_SCHEDULES = {
  // Her gün saat 09:00'da çalış
  DUE_DATE_CHECK: '0 9 * * *',
  
  // Her 6 saatte bir çalış
  DUE_DATE_CHECK_FREQUENT: '0 */6 * * *',
  
  // Hafta içi her gün saat 09:00 ve 17:00'da çalış
  DUE_DATE_CHECK_BUSINESS: '0 9,17 * * 1-5'
}