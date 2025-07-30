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
  const [isSyncing, setIsSyncing] = useState(false)
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
    }
  }

  // Sayfa yüklendiğinde durumu kontrol et
  useEffect(() => {
    checkGoogleStatus()
    
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
  }, [])

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
    setIsSyncing(true)
    try {
      const response = await fetch('/api/google/sync/bidirectional', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const { tasksToCalendar, calendarToTasks } = data.results
        const totalErrors = tasksToCalendar.failed + calendarToTasks.failed
        const hasErrors = totalErrors > 0
        
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Ayarlar
        </h1>
        <p className="text-muted-foreground mt-2">
          Hesap ayarlarınızı ve entegrasyonlarınızı yönetin
        </p>
      </div>

      <Separator />

      {/* Google Calendar Entegrasyonu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Entegrasyonu
          </CardTitle>
          <CardDescription>
            Görevlerinizi Google Calendar ile senkronize edin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bağlantı Durumu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Bağlantı Durumu:</span>
              {isConnected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Bağlı
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Bağlı Değil
                </Badge>
              )}
            </div>

            {/* Bağlan/Bağlantıyı Kes Butonu */}
            {isConnected ? (
              <Button
                variant="destructive"
                onClick={handleDisconnectGoogle}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Bağlantıyı Kes
              </Button>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Google Calendar'ı Bağla
              </Button>
            )}
          </div>

          {/* Entegrasyon Detayları */}
          {isConnected && integration && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Google Hesap ID:</span>{' '}
                {integration.googleAccountId}
              </div>
              <div className="text-sm">
                <span className="font-medium">Takvim ID:</span>{' '}
                {integration.calendarId}
              </div>
              <div className="text-sm">
                <span className="font-medium">Bağlantı Tarihi:</span>{' '}
                {new Date(integration.connectedAt).toLocaleDateString('tr-TR')}
              </div>
              {integration.lastSyncAt && (
                <div className="text-sm">
                  <span className="font-medium">Son Senkronizasyon:</span>{' '}
                  {new Date(integration.lastSyncAt).toLocaleDateString('tr-TR')}
                </div>
              )}
            </div>
          )}

          {/* DEBUG BİLGİSİ */}
          {isConnected && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              <p><strong>Debug:</strong></p>
              <p>İsConnected: {isConnected.toString()}</p>
              <p>Calendars Count: {calendars.length}</p>
              <p>Selected Calendar IDs: [{selectedCalendarIds.join(', ')}]</p>
              {calendars.length > 0 && (
                <div>
                  <p>Calendars:</p>
                  <ul>
                    {calendars.map(cal => (
                      <li key={cal.id}>• {cal.name} ({cal.id})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Planner Takvimi Durumu */}
          {isConnected && integration && (
            <>
              {/* Planner Takvimi Bilgi Kartı */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Planner Takvimi</h3>
                      {integration.plannerCalendarCreated ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          ✓ Oluşturuldu
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                          Bekleniyor
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Planner görevleriniz otomatik olarak bu takvime yazılır. Diğer uygulamalarla çakışmaz.
                    </p>
                    {integration.plannerCalendarId && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://calendar.google.com/calendar/embed?src=${integration.plannerCalendarId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Google Calendar'da Aç
                        </a>
                      </div>
                    )}
                  </div>
                  {!integration.plannerCalendarCreated && (
                    <Button
                      onClick={handleCreatePlannerCalendar}
                      disabled={isCreatingPlannerCalendar}
                      size="sm"
                    >
                      {isCreatingPlannerCalendar && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Oluştur
                    </Button>
                  )}
                </div>
              </div>

              {/* Okunacak Takvimler Seçimi */}
              {calendars.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Okunacak Takvimler (Google Calendar → Planner)
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Bu takvimlerden event'ler Planner'a görev olarak aktarılır
                    </p>
                  </div>

                  {/* Takvim Seçim Listesi */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border dark:border-gray-700 rounded-lg p-3">
                    {calendars
                      .filter(cal => !cal.isPlannerCalendar) // Planner Takvimi'ni filtrele
                      .map((calendar) => (
                      <label
                        key={calendar.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedReadOnlyCalendarIds.includes(calendar.id)}
                          onChange={() => handleReadOnlyCalendarToggle(calendar.id)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {calendar.primary && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-1 rounded">Ana</span>
                          )}
                          <span className="font-medium">{calendar.name}</span>
                          {calendar.description && (
                            <span className="text-xs text-muted-foreground">({calendar.description})</span>
                          )}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full border dark:border-gray-600" 
                          style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                        />
                      </label>
                    ))}
                  </div>

                  {/* Seçilen Okunacak Takvimler */}
                  {selectedReadOnlyCalendarIds.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Seçilen Okunacak Takvimler:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedReadOnlyCalendarIds.map((calendarId) => {
                          const calendar = calendars.find(cal => cal.id === calendarId)
                          return calendar ? (
                            <Badge key={calendarId} variant="secondary" className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                              />
                              {calendar.name}
                              <button
                                onClick={() => handleReadOnlyCalendarToggle(calendarId)}
                                className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center"
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Kaydet Butonu */}
                  <Button
                    onClick={handleSaveReadOnlyCalendars}
                    disabled={isUpdatingCalendars}
                    className="w-full"
                  >
                    {isUpdatingCalendars && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Okunacak Takvim Seçimini Kaydet ({selectedReadOnlyCalendarIds.length} takvim)
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Bu takvimlerden event'ler Planner'a task olarak aktarılır. İsteğe bağlı.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Otomatik Senkronizasyon</p>
                  <p className="text-sm text-muted-foreground">
                    Görevler otomatik olarak takvime eklenir
                  </p>
                </div>
                <Switch
                  checked={integration.syncEnabled}
                  onCheckedChange={(checked) => {
                    // TODO: Sync ayarını güncelle
                    setIntegration({
                      ...integration,
                      syncEnabled: checked
                    })
                  }}
                />
              </div>

              {/* Sync İstatistikleri */}
              {syncStats && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{syncStats.synced}</div>
                    <div className="text-sm text-muted-foreground">Senkronize</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{syncStats.pending}</div>
                    <div className="text-sm text-muted-foreground">Beklemede</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{syncStats.error}</div>
                    <div className="text-sm text-muted-foreground">Hata</div>
                  </div>
                </div>
              )}

              {/* Manuel Sync Butonu */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">İki Yönlü Manuel Senkronizasyon</p>
                  <p className="text-sm text-muted-foreground">
                    Planner ↔ Calendar arasında tam sync
                  </p>
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  variant="outline"
                >
                  {isSyncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
                </Button>
              </div>

            </>
          )}

          {/* Bilgi Notu */}
          <div className="text-sm text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
            <p className="font-medium mb-1">💡 Nasıl Çalışır?</p>
            <div className="space-y-2">
              <p>
                <strong>📝 Planner → Google:</strong> Görevleriniz otomatik "Planner Takvimi"ne yazılır
              </p>
              <p>
                <strong>📅 Google → Planner:</strong> Seçtiğiniz takvimlerden event'ler Planner'a aktarılır
              </p>
              <p className="text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-500/20 p-2 rounded text-xs">
                <strong>⚠️ Önemli:</strong> Eğer Planner Takvimi oluşturulamıyorsa, Google Calendar 
                bağlantınızı yenilemeniz gerekebilir (yeni yetkiler eklendi).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      
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