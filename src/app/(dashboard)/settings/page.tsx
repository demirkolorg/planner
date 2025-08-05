'use client'

import { useState, useEffect } from 'react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Settings, Loader2, User, Bell, Palette, Shield, HelpCircle, Play, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NotificationDialog } from '@/components/ui/notification-dialog'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  const { lastSyncAt: globalLastSyncAt, isSyncing: globalIsSyncing, setIsSyncing, setLastSyncAt, updateSyncStatus } = useGoogleCalendarStore()
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]) // backward compatibility
  const [selectedReadOnlyCalendarIds, setSelectedReadOnlyCalendarIds] = useState<string[]>([])
  const [initialSelectedReadOnlyCalendarIds, setInitialSelectedReadOnlyCalendarIds] = useState<string[]>([]) // Başlangıç değeri
  const [isUpdatingCalendars, setIsUpdatingCalendars] = useState(false)
  const [isCreatingPlannerCalendar, setIsCreatingPlannerCalendar] = useState(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  
  
  
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

  const router = useRouter()

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
          const initialIds = calendarsData.selectedReadOnlyCalendarIds || []
          setSelectedReadOnlyCalendarIds(initialIds)
          setInitialSelectedReadOnlyCalendarIds(initialIds) // Başlangıç değerini kaydet
        }
      }
    } catch (_error) {
      console.error('Google durum kontrol hatası:', _error)
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
  }, [updateSyncStatus, isInitialLoading])

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
        // Başlangıç değerini güncelle (başarılı kayıt sonrası)
        setInitialSelectedReadOnlyCalendarIds(selectedReadOnlyCalendarIds)
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

  // Tab konfigürasyonu
  const tabs = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: Calendar,
      description: 'Takvim entegrasyonu ve senkronizasyon ayarları'
    },
    {
      id: 'profile',
      name: 'Profil',
      icon: User,
      description: 'Hesap bilgileri ve kişisel ayarlar'
    },
    {
      id: 'notifications',
      name: 'Bildirimler',
      icon: Bell,
      description: 'Bildirim tercihleri ve uyarılar'
    },
    {
      id: 'appearance',
      name: 'Görünüm',
      icon: Palette,
      description: 'Tema ve görünüm ayarları'
    },
    {
      id: 'privacy',
      name: 'Gizlilik',
      icon: Shield,
      description: 'Güvenlik ve gizlilik ayarları'
    },
    {
      id: 'help',
      name: 'Yardım',
      icon: HelpCircle,
      description: 'Tur ve yardım seçenekleri'
    }
  ]

  return (
    <>
      <div className="min-h-screen bg-secondary/20">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-card-foreground flex items-center gap-3">
                  <Settings className="h-8 w-8 text-primary" />
                  Ayarlar
                </h1>
                <p className="text-muted-foreground mt-2">
                  Hesap ayarlarınızı ve entegrasyonlarınızı yönetin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Tabs defaultValue="google-calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Google Calendar Tab */}
            <TabsContent value="google-calendar" className="mt-6">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Takvim entegrasyonu ve senkronizasyon ayarları
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                  <span>Nasıl Çalışır?</span>
                </Button>
              </div>
              <div className="space-y-6">
                {/* 1. Bağlantı Durumu */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${isInitialLoading ? 'bg-gray-400' : isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">
                          {isInitialLoading ? 'Kontrol ediliyor...' : isConnected ? 'Google Calendar\'a bağlı' : 'Bağlantı yok'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
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
                        Google Calendar&apos;ı Bağla
                      </Button>
                    )}
                  </div>
                </div>

                {/* 2. Bağlı Durumda Gösterilen İçerik */}
                {!isInitialLoading && isConnected && integration && (
                  <>

                    {/* Senkronizasyon Kontrolleri */}
                    <div className="bg-card rounded-xl border border-border p-6">
                      <h3 className="font-semibold text-card-foreground mb-4">Senkronizasyon</h3>
                      
                      {/* Otomatik Sync */}
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                          <p className="font-medium text-card-foreground">Otomatik Senkronizasyon</p>
                          <p className="text-sm text-muted-foreground">Görevler otomatik olarak takvime eklenir</p>
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
                          <p className="font-medium text-card-foreground">Manuel Senkronizasyon</p>
                          {(globalLastSyncAt || integration?.lastSyncAt) ? (
                            <p className="text-sm text-muted-foreground">
                              Son sync: {new Date(globalLastSyncAt || integration!.lastSyncAt).toLocaleString('tr-TR')}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
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
                        <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{syncStats.synced}</div>
                              <div className="text-xs text-muted-foreground">Senkronize</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{syncStats.pending}</div>
                              <div className="text-xs text-muted-foreground">Beklemede</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{syncStats.error}</div>
                              <div className="text-xs text-muted-foreground">Hata</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Takvim Seçimi - İki Sütun */}
                    {calendars.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sol Sütun - Okunacak Takvimler */}
                        <div className="bg-card rounded-xl border border-border p-6">
                          <div className="mb-4">
                            <h3 className="font-semibold text-card-foreground mb-1">
                              📖 Okunacak Takvimler
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Bu takvimlerden event'ler Planner'a görev olarak aktarılacak (isteğe bağlı)
                            </p>
                          </div>

                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {calendars
                              .filter(cal => !cal.isPlannerCalendar)
                              .map((calendar) => (
                              <label
                                key={calendar.id}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary/50 cursor-pointer"
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
                                    <span className="font-medium text-card-foreground">
                                      {calendar.name}
                                    </span>
                                    {calendar.primary && (
                                      <Badge variant="secondary" className="text-xs">Ana</Badge>
                                    )}
                                  </div>
                                  {calendar.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {calendar.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>

                          {/* Seçim değiştiğinde ve seçili takvim varsa kaydet butonu göster */}
                          {(() => {
                            // Değişiklik var mı kontrol et
                            const hasChanges = JSON.stringify(selectedReadOnlyCalendarIds.sort()) !== JSON.stringify(initialSelectedReadOnlyCalendarIds.sort())
                            const hasSelection = selectedReadOnlyCalendarIds.length > 0

                            return hasSelection && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <Button
                                  onClick={handleSaveReadOnlyCalendars}
                                  disabled={isUpdatingCalendars || !hasChanges}
                                  className="w-full"
                                >
                                  {isUpdatingCalendars && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  {hasChanges ? `Seçimi Kaydet (${selectedReadOnlyCalendarIds.length} takvim)` : `Kayıtlı (${selectedReadOnlyCalendarIds.length} takvim)`}
                                </Button>
                              </div>
                            )
                          })()}
                        </div>

                        {/* Sağ Sütun - Yazılacak Takvim */}
                        <div className="bg-card rounded-xl border border-border p-6">
                          <div className="mb-4">
                            <h3 className="font-semibold text-card-foreground mb-1">
                              ✏️ Yazılacak Takvim
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Planner görevleri bu takvime otomatik olarak yazılır
                            </p>
                          </div>

                          {/* Planner Takvimi */}
                          {(() => {
                            const plannerCalendar = calendars.find(cal => cal.isPlannerCalendar)
                            return plannerCalendar ? (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: plannerCalendar.backgroundColor || '#10b981' }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-card-foreground">
                                        {plannerCalendar.name}
                                      </span>
                                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                        Aktif
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                      Tüm Planner görevleri bu takvime senkronize edilir
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <p>✅ Planner Takvimi hazır ve çalışıyor</p>
                                    <p className="text-xs mt-1">Görevleriniz otomatik olarak bu takvime yazılacak</p>
                                  </div>
                                  {integration.plannerCalendarId && (
                                    <a
                                      href={`https://calendar.google.com/calendar/embed?src=${integration.plannerCalendarId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                                    >
                                      Google Calendar&apos;da Aç
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 rounded-full bg-yellow-400" />
                                    <div>
                                      <span className="font-medium text-card-foreground">
                                        Planner Takvimi
                                      </span>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        Henüz oluşturulmamış - oluşturulması gerekiyor
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={handleCreatePlannerCalendar}
                                    disabled={isCreatingPlannerCalendar}
                                    size="sm"
                                  >
                                    {isCreatingPlannerCalendar && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Takvimi Oluştur
                                  </Button>
                                </div>
                                
                                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                  <p>⚠️ Planner Takvimi oluşturulması gerekiyor</p>
                                  <p className="text-xs mt-1">Görevlerinizi Google Calendar'a senkronize etmek için bu takvimi oluşturun</p>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                  </>
                )}
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Hesap bilgileri ve kişisel ayarlar
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Profil Ayarları</h3>
                <p className="text-gray-500 dark:text-gray-400">Bu bölüm yakında kullanıma sunulacak.</p>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Bildirim tercihleri ve uyarılar
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Bildirim Ayarları</h3>
                <p className="text-gray-500 dark:text-gray-400">Bu bölüm yakında kullanıma sunulacak.</p>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="mt-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Tema ve görünüm ayarları
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Görünüm Ayarları</h3>
                <p className="text-gray-500 dark:text-gray-400">Bu bölüm yakında kullanıma sunulacak.</p>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="mt-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Güvenlik ve gizlilik ayarları
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">Gizlilik Ayarları</h3>
                <p className="text-gray-500 dark:text-gray-400">Bu bölüm yakında kullanıma sunulacak.</p>
              </div>
            </TabsContent>

            {/* Help Tab */}
            <TabsContent value="help" className="mt-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Yardım seçenekleri
                </p>
              </div>
              <div className="space-y-6">

                {/* FAQ */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Sık Sorulan Sorular</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-card-foreground">Google Calendar senkronizasyonu nasıl çalışır?</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Görevleriniz otomatik olarak Google Calendar'ınızda "Planner Takvimi" adlı ayrı bir takvimde gösterilir.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Ctrl+K kısayolu ne işe yarar?</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Her yerden hızlıca yeni görev oluşturmanızı sağlar.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Projeler ve etiketler arasındaki fark nedir?</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Projeler büyük hedeflerinizi organize eder, etiketler ise görevlerinizi kategorilere ayırır.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">Klavye Kısayolları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Hızlı görev ekle</span>
                      <kbd className="px-2 py-1 text-xs bg-muted border rounded">Ctrl+K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Menüyü kapat/aç</span>
                      <kbd className="px-2 py-1 text-xs bg-muted border rounded">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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

      {/* Google Calendar Info Modal */}
      <Dialog open={isInfoModalOpen} onOpenChange={() => setIsInfoModalOpen(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  💡 Google Calendar Entegrasyonu Nasıl Çalışır?
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="sr-only">
              Google Calendar entegrasyon bilgilendirme penceresi
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-semibold text-foreground mb-2">🔗 Bağlantı Kurma:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Google hesabınızı Planner'a bağlayın</li>
                  <li>• Planner otomatik olarak takvimlerinize erişim izni alır</li>
                  <li>• Güvenli OAuth 2.0 protokolü kullanılır</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">📝 Planner → Google Calendar:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Planner'da oluşturuğunuz görevler otomatik olarak Google Calendar'a aktarılır</li>
                  <li>• "Planner Takvimi" adında özel bir takvim oluşturulur</li>
                  <li>• Görev başlıkları, açıklamaları ve tarih bilgileri senkronize edilir</li>
                  <li>• Görev tamamlandığında Calendar'daki event de güncellenir</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">📅 Google Calendar → Planner:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Seçtiğiniz takvimlerden event'ler Planner'a görev olarak aktarılır</li>
                  <li>• Hangi takvimlerin okunacağını kendiniz seçebilirsiniz</li>
                  <li>• Event başlıkları ve tarihleri görev olarak eklenir</li>
                  <li>• Çift yönlü senkronizasyon ile her iki platform da güncel kalır</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">⚙️ Senkronizasyon Seçenekleri:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>Otomatik:</strong> Görevler anında senkronize edilir</li>
                  <li>• <strong>Manuel:</strong> İstediğiniz zaman "Şimdi Senkronize Et" butonuna basabilirsiniz</li>
                  <li>• Senkronizasyon istatistikleri ile işlem durumunu takip edebilirsiniz</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">🔒 Güvenlik:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Sadece takvim verilerinize erişim izni alınır</li>
                  <li>• Verileriniz güvenli şekilde şifrelenir</li>
                  <li>• İstediğiniz zaman bağlantıyı kesebilirsiniz</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">💡 İpuçları:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Planner Takvimi'ni Google Calendar'da ayrı bir renkte görüntüleyebilirsiniz</li>
                  <li>• Mobil cihazlarınızda da senkronize görevlerinizi görebilirsiniz</li>
                  <li>• Çakışan etkinliklerinizi tek bir yerden yönetebilirsiniz</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsInfoModalOpen(false)} className="min-w-[100px]">
              Anladım
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}