'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { NotificationDialog } from '@/components/ui/notification-dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ManualEventWarning } from '@/components/settings/manual-event-warning'
import { useGoogleCalendarStore } from '@/store/googleCalendarStore'

interface GoogleIntegration {
  id: string
  googleAccountId: string
  calendarId: string // backward compatibility
  readOnlyCalendarIds: string[]
  plannerCalendarId: string | null
  plannerCalendarCreated: boolean
  syncEnabled: boolean
  lastSyncAt: string | null
  connectedAt: string
}

interface SyncStats {
  synced: number
  pending: number
  error: number
}

interface GoogleCalendar {
  id: string
  name: string
  description?: string
  primary: boolean
  backgroundColor?: string
  accessRole: string
  selected: boolean
  isPlannerCalendar: boolean
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true) // İlk yükleme durumu
  const { lastSyncAt: globalLastSyncAt, isSyncing: globalIsSyncing, setIsSyncing, setLastSyncAt, updateSyncStatus, isConnected: globalIsConnected } = useGoogleCalendarStore()
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]) // backward compatibility
  const [selectedReadOnlyCalendarIds, setSelectedReadOnlyCalendarIds] = useState<string[]>([])
  const [isUpdatingCalendars, setIsUpdatingCalendars] = useState(false)
  const [isCreatingPlannerCalendar, setIsCreatingPlannerCalendar] = useState(false)
  
  
  
  // Modal states
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: "success" | "error" | "warning" | "info"
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  })

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  })

  // Modal helper functions
  const showNotification = (title: string, message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setNotificationModal({
      isOpen: true,
      title,
      message,
      type
    })
  }

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      onConfirm
    })
  }

  const closeNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }))
  }

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
  }


  // Google Calendar durumunu kontrol et
  const checkGoogleStatus = async () => {
    try {
      const [statusResponse, syncResponse] = await Promise.all([
        fetch('/api/google/auth/status'),
        fetch('/api/google/sync')
      ])
      
      const statusData = await statusResponse.json()
      if (statusData.success) {
        setIsConnected(statusData.connected)
        setIntegration(statusData.integration)
      }

      const syncData = await syncResponse.json()
      if (syncData.success) {
        setSyncStats(syncData.stats)
      }

      // Takvim listesini al (eğer bağlıysa)
      if (statusData.success && statusData.connected) {
        const calendarsResponse = await fetch('/api/google/calendars')
        const calendarsData = await calendarsResponse.json()
        if (calendarsData.success) {
          setCalendars(calendarsData.calendars)
          setSelectedCalendarIds(calendarsData.selectedCalendarIds || []) // backward compatibility
          setSelectedReadOnlyCalendarIds(calendarsData.selectedReadOnlyCalendarIds || [])
        }
      }
    } catch (_error) {
      console.error('Google durum kontrol hatası:', error)
    } finally {
      setIsInitialLoading(false) // İlk yükleme tamamlandı
    }
  }

  // Sayfa yüklendiğinde durumu kontrol et
  useEffect(() => {
    checkGoogleStatus()
    updateSyncStatus() // Global store'u güncelle
    
    // Maksimum 5 saniye sonra loading'i kapat (timeout)
    const loadingTimeout = setTimeout(() => {
      if (isInitialLoading) {
        setIsInitialLoading(false)
      }
    }, 5000)
    
    // URL parametrelerini kontrol et ve mesaj göster
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    
    if (success === 'calendar_connected_existing') {
      showNotification(
        'Google Calendar Bağlandı',
        '✅ Bağlantı başarıyla tamamlandı!\n📅 Mevcut Planner Takvimi kullanılacak.',
        'success'
      )
    } else if (success === 'calendar_connected_new') {
      showNotification(
        'Google Calendar Bağlandı',
        '✅ Bağlantı başarıyla tamamlandı!\n🆕 Planner Takvimi oluşturulması gerekiyor.',
        'success'
      )
    } else if (error === 'connection_failed') {
      showNotification(
        'Bağlantı Hatası',
        '❌ Google Calendar bağlantısı kurulamadı.\nLütfen tekrar deneyin.',
        'error'
      )
    } else if (error === 'oauth_cancelled') {
      showNotification(
        'Bağlantı İptal Edildi',
        '⚠️ Google Calendar yetkilendirmesi iptal edildi.',
        'warning'
      )
    } else if (error === 'token_invalid') {
      showNotification(
        'Oturum Hatası',
        '❌ Oturum süresi dolmuş olabilir.\nLütfen sayfayı yenileyin ve tekrar deneyin.',
        'error'
      )
    } else if (error === 'database_error') {
      showNotification(
        'Veritabanı Hatası',
        '❌ Veritabanı bağlantı sorunu.\nLütfen bir kaç dakika sonra tekrar deneyin.',
        'error'
      )
    } else if (error) {
      showNotification(
        'Bilinmeyen Hata',
        `❌ Beklenmeyen bir hata oluştu: ${error}\nLütfen tekrar deneyin.`,
        'error'
      )
    }
    
    // URL'yi temizle
    if (success || error) {
      window.history.replaceState({}, '', '/settings')
    }
    
    // Cleanup function
    return () => {
      clearTimeout(loadingTimeout)
    }
  }, [updateSyncStatus])

  // Google Calendar bağla
  const handleConnectGoogle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google/auth/connect')
      const data = await response.json()

      if (data.success && data.authUrl) {
        // Yeni pencerede auth URL'i aç
        window.location.href = data.authUrl
      } else {
        showNotification(
          'Bağlantı Hatası',
          '❌ Google Calendar bağlantısı oluşturulamadı.\nLütfen tekrar deneyin.',
          'error'
        )
      }
    } catch (_error) {
      showNotification(
        'Bağlantı Hatası',
        '❌ Bağlantı kurulurken hata oluştu.\nLütfen tekrar deneyin.',
        'error'
      )
    }
    setIsLoading(false)
  }

  // Manuel senkronizasyon (İki yönlü)
  const handleManualSync = async () => {
    if (globalIsSyncing) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/google/sync/bidirectional', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const newSyncTime = new Date().toISOString()
        setLastSyncAt(newSyncTime)
        
        const { tasksToCalendar, calendarToTasks } = data.results
        const totalErrors = tasksToCalendar.failed + calendarToTasks.failed
        const hasErrors = totalErrors > 0
        
        // Sync istatistiklerini güncelle
        setSyncStats({
          synced: tasksToCalendar.synced + calendarToTasks.synced,
          pending: 0, // Bidirectional sync sonrası bekleyen olmaz
          error: totalErrors
        })
        
        showNotification(
          'Senkronizasyon Tamamlandı',
          `${hasErrors ? '⚠️' : '✅'} İki yönlü senkronizasyon tamamlandı!\n\n📅 Planner → Calendar:\n✅ ${tasksToCalendar.synced} görev senkronize edildi\n❌ ${tasksToCalendar.failed} görev başarısız\n\n📋 Calendar → Planner:\n✅ ${calendarToTasks.synced} event işlendi\n❌ ${calendarToTasks.failed} event başarısız${hasErrors ? '\n\n💡 Console\'u kontrol edin' : ''}`,
          hasErrors ? 'warning' : 'success'
        )
        
        // Durumu yeniden yükle
        checkGoogleStatus()
      } else {
        showNotification(
          'Senkronizasyon Başarısız',
          `❌ Senkronizasyon başarısız:\n${data.error}`,
          'error'
        )
      }
    } catch (_error) {
      showNotification(
        'Senkronizasyon Hatası',
        '❌ Senkronizasyon sırasında beklenmeyen bir hata oluştu.\nLütfen tekrar deneyin.',
        'error'
      )
    }
    setIsSyncing(false)
  }


  // Planner Takvimi oluştur
  const handleCreatePlannerCalendar = async () => {
    setIsCreatingPlannerCalendar(true)
    try {
      const response = await fetch('/api/google/planner-calendar/create', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        showNotification(
          'Planner Takvimi Oluşturuldu',
          `✅ Planner Takvimi başarıyla oluşturuldu!\n📅 Takvim ID: ${data.calendarId}`,
          'success'
        )
        // Durumu yeniden yükle
        checkGoogleStatus()
      } else if (data.needsReauth) {
        // Yeniden yetkilendirme gerekiyor
        showConfirmation(
          'Yeniden Yetkilendirme Gerekli',
          `${data.error}\n\nGoogle Calendar bağlantınızı şimdi yenilemek ister misiniz?`,
          () => {
            handleDisconnectGoogle().then(() => {
              handleConnectGoogle()
            })
          }
        )
      } else {
        showNotification(
          'Takvim Oluşturulamadı',
          `❌ Planner Takvimi oluşturulamadı:\n${data.error}`,
          'error'
        )
      }
    } catch (_error) {
      showNotification(
        'Beklenmeyen Hata',
        '❌ Planner Takvimi oluşturulurken beklenmeyen bir hata oluştu.\nLütfen tekrar deneyin.',
        'error'
      )
    }
    setIsCreatingPlannerCalendar(false)
  }

  // Okunacak takvim seçimi/çıkarma
  const handleReadOnlyCalendarToggle = (calendarId: string) => {
    setSelectedReadOnlyCalendarIds(prev => {
      if (prev.includes(calendarId)) {
        // Çıkar
        return prev.filter(id => id !== calendarId)
      } else {
        // Ekle
        return [...prev, calendarId]
      }
    })
  }

  // Okunacak takvim seçimini kaydet
  const handleSaveReadOnlyCalendars = async () => {
    setIsUpdatingCalendars(true)
    try {
      const response = await fetch('/api/google/calendars/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          readOnlyCalendarIds: selectedReadOnlyCalendarIds
        })
      })
      const data = await response.json()

      if (data.success) {
        showNotification(
          'Takvim Seçimi Güncellendi',
          `✅ Okunacak takvim seçimi güncellendi!\n📅 ${selectedReadOnlyCalendarIds.length} takvim seçildi`,
          'success'
        )
        // Durumu yeniden yükle
        checkGoogleStatus()
      } else {
        showNotification(
          'Seçim Güncellenemedi',
          `❌ Takvim seçimi güncellenemedi:\n${data.error}`,
          'error'
        )
      }
    } catch (_error) {
      showNotification(
        'Kaydetme Hatası',
        '❌ Takvim seçimi kaydedilirken hata oluştu.\nLütfen tekrar deneyin.',
        'error'
      )
    }
    setIsUpdatingCalendars(false)
  }

  // Google Calendar bağlantısını kes
  const handleDisconnectGoogle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google/auth/disconnect', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setIsConnected(false)
        setIntegration(null)
        showNotification(
          'Bağlantı Kaldırıldı',
          '✅ Google Calendar bağlantısı başarıyla kaldırıldı.',
          'success'
        )
      } else {
        showNotification(
          'Bağlantı Kaldırılamadı',
          `❌ Bağlantı kaldırılırken hata oluştu:\n${data.error || 'Bilinmeyen hata'}`,
          'error'
        )
      }
    } catch (_error) {
      showNotification(
        'Bağlantı Hatası',
        '❌ Bağlantı kaldırılırken beklenmeyen bir hata oluştu.\nLütfen tekrar deneyin.',
        'error'
      )
    }
    setIsLoading(false)
  }

  return (<>
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Google Calendar Entegrasyonu
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Görevlerinizi Google Calendar ile senkronize edin
        </p>
      </div>

      {/* Ana İçerik */}
      <div className="space-y-6">
        {/* 1. Bağlantı Durumu */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isInitialLoading ? 'bg-gray-400' : isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isInitialLoading ? 'Kontrol ediliyor...' : isConnected ? 'Google Calendar\'a bağlı' : 'Bağlantı yok'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isInitialLoading ? 'Bağlantı durumu kontrol ediliyor' : isConnected ? 'Senkronizasyon aktif' : 'Bağlantı kurulması gerekiyor'}
                </p>
              </div>
            </div>
            
            {isInitialLoading ? (
              <Button disabled variant="secondary">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yükleniyor
              </Button>
            ) : isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnectGoogle}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Bağlantıyı Kes
              </Button>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Google Calendar'ı Bağla
              </Button>
            )}
          </div>
        </div>

        {/* 2. Bağlı Durumda Gösterilen İçerik */}
        {!isInitialLoading && isConnected && integration && (
          <>
            {/* Planner Takvimi Durumu */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Planner Takvimi</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Görevlerinizin yazıldığı özel takvim
                  </p>
                </div>
                {integration.plannerCalendarCreated ? (
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      ✓ Aktif
                    </Badge>
                    {integration.plannerCalendarId && (
                      <a
                        href={`https://calendar.google.com/calendar/embed?src=${integration.plannerCalendarId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                      >
                        Google Calendar'da Aç
                      </a>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleCreatePlannerCalendar}
                    disabled={isCreatingPlannerCalendar}
                    size="sm"
                  >
                    {isCreatingPlannerCalendar ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Takvimi Oluştur
                  </Button>
                )}
              </div>
            </div>

            {/* Senkronizasyon Kontrolleri */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Senkronizasyon</h3>
              
              {/* Otomatik Sync */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Otomatik Senkronizasyon</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Görevler otomatik olarak takvime eklenir</p>
                </div>
                <Switch
                  checked={integration?.syncEnabled || false}
                  onCheckedChange={(checked) => {
                    if (integration) {
                      setIntegration({
                        ...integration,
                        syncEnabled: checked
                      })
                    }
                  }}
                />
              </div>
              
              {/* Manuel Sync */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Manuel Senkronizasyon</p>
                  {(globalLastSyncAt || integration?.lastSyncAt) ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Son sync: {new Date(globalLastSyncAt || integration!.lastSyncAt).toLocaleString('tr-TR')}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Henüz senkronizasyon yapılmamış
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={globalIsSyncing}
                  variant="outline"
                >
                  {globalIsSyncing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {globalIsSyncing ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}
                </Button>
              </div>

              {/* Sync İstatistikleri */}
              {syncStats && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{syncStats.synced}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Senkronize</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{syncStats.pending}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Beklemede</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{syncStats.error}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hata</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Takvim Seçimi */}
            {calendars.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Okunacak Takvimler
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bu takvimlerden event'ler Planner'a görev olarak aktarılacak (isteğe bağlı)
                  </p>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {calendars
                    .filter(cal => !cal.isPlannerCalendar)
                    .map((calendar) => (
                    <label
                      key={calendar.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedReadOnlyCalendarIds.includes(calendar.id)}
                        onChange={() => handleReadOnlyCalendarToggle(calendar.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {calendar.name}
                          </span>
                          {calendar.primary && (
                            <Badge variant="secondary" className="text-xs">Ana</Badge>
                          )}
                        </div>
                        {calendar.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {calendar.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {selectedReadOnlyCalendarIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handleSaveReadOnlyCalendars}
                      disabled={isUpdatingCalendars}
                      className="w-full"
                    >
                      {isUpdatingCalendars && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Seçimi Kaydet ({selectedReadOnlyCalendarIds.length} takvim)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Nasıl Çalışır */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                💡 Nasıl Çalışır?
              </h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>
                  <strong>📝 Planner → Google:</strong> Görevleriniz otomatik olarak "Planner Takvimi"ne yazılır
                </p>
                <p>
                  <strong>📅 Google → Planner:</strong> Seçtiğiniz takvimlerden event'ler Planner'a görev olarak aktarılır
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* Notification Modal */}
    <NotificationDialog
      isOpen={notificationModal.isOpen}
      onClose={closeNotification}
      title={notificationModal.title}
      message={notificationModal.message}
      type={notificationModal.type}
    />

    {/* Confirmation Modal */}
    <ConfirmationDialog
      isOpen={confirmationModal.isOpen}
      onClose={closeConfirmation}
      onConfirm={confirmationModal.onConfirm}
      title={confirmationModal.title}
      message={confirmationModal.message}
      confirmText="Evet"
      cancelText="İptal"
    />
  </>
  )
}