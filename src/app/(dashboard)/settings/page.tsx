'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface GoogleIntegration {
  id: string
  googleAccountId: string
  calendarId: string
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
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([])
  const [isUpdatingCalendars, setIsUpdatingCalendars] = useState(false)

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
          setSelectedCalendarIds(calendarsData.selectedCalendarIds || [])
        }
      }
    } catch (error) {
      console.error('Google durum kontrol hatası:', error)
    }
  }

  // Sayfa yüklendiğinde durumu kontrol et
  useEffect(() => {
    checkGoogleStatus()
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
        alert('Google Calendar bağlantısı oluşturulamadı')
      }
    } catch (error) {
      alert('Bağlantı kurulurken hata oluştu')
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
        alert(`İki Yönlü Senkronizasyon Tamamlandı!

📅 Planner → Calendar:
✅ ${tasksToCalendar.synced} görev senkronize edildi
❌ ${tasksToCalendar.failed} görev başarısız

📋 Calendar → Planner:  
✅ ${calendarToTasks.synced} event işlendi
❌ ${calendarToTasks.failed} event başarısız

💡 Console'u kontrol et - all-day event logları var!`)
        
        // Durumu yeniden yükle
        checkGoogleStatus()
      } else {
        alert('Senkronizasyon başarısız: ' + data.error)
      }
    } catch (error) {
      alert('Senkronizasyon sırasında hata oluştu')
    }
    setIsSyncing(false)
  }

  // Webhook kurulumu
  const handleSetupWebhook = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google/webhook/setup', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert(`Webhook başarıyla kuruldu!\nChannel ID: ${data.channelId}`)
      } else {
        alert('Webhook kurulum başarısız: ' + data.error)
      }
    } catch (error) {
      alert('Webhook kurulum sırasında hata oluştu')
    }
    setIsLoading(false)
  }

  // Tek takvim seçimi/çıkarma
  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendarIds(prev => {
      if (prev.includes(calendarId)) {
        // Çıkar (en az 1 takvim seçili kalmalı)
        if (prev.length > 1) {
          return prev.filter(id => id !== calendarId)
        }
        return prev // Son takvimi çıkarma
      } else {
        // Ekle
        return [...prev, calendarId]
      }
    })
  }

  // Tüm takvimleri seç
  const handleSelectAll = () => {
    setSelectedCalendarIds(calendars.map(cal => cal.id))
  }

  // Tüm takvimleri temizle (primary hariç)
  const handleClearAll = () => {
    const primaryCalendar = calendars.find(cal => cal.primary)
    setSelectedCalendarIds(primaryCalendar ? [primaryCalendar.id] : [calendars[0]?.id].filter(Boolean))
  }

  // Seçimi kaydet
  const handleSaveCalendarSelection = async () => {
    if (selectedCalendarIds.length === 0) {
      alert('En az bir takvim seçilmeli')
      return
    }

    setIsUpdatingCalendars(true)
    try {
      const selectedNames = selectedCalendarIds.map(id => 
        calendars.find(cal => cal.id === id)?.name || 'Unknown'
      )

      const response = await fetch('/api/google/calendar/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarIds: selectedCalendarIds,
          calendarNames: selectedNames
        })
      })
      const data = await response.json()

      if (data.success) {
        alert(data.message)
        // Durumu yeniden yükle
        checkGoogleStatus()
      } else {
        alert('Takvim seçimi başarısız: ' + data.error)
      }
    } catch (error) {
      alert('Takvim seçimi güncellenirken hata oluştu')
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
        alert('Google Calendar bağlantısı kaldırıldı')
      } else {
        alert('Bağlantı kaldırılırken hata oluştu')
      }
    } catch (error) {
      alert('Bağlantı kaldırılırken hata oluştu')
    }
    setIsLoading(false)
  }

  return (
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
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
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

          {/* Senkronizasyon Ayarları */}
          {isConnected && integration && (
            <>
              {/* Çoklu Takvim Seçimi */}
              {calendars.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Senkronize Edilecek Takvimler</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={selectedCalendarIds.length === calendars.length}
                      >
                        Hepsini Seç
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={selectedCalendarIds.length <= 1}
                      >
                        Temizle
                      </Button>
                    </div>
                  </div>

                  {/* Checkbox List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {calendars.map((calendar) => (
                      <label
                        key={calendar.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCalendarIds.includes(calendar.id)}
                          onChange={() => handleCalendarToggle(calendar.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {calendar.primary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Ana</span>
                          )}
                          <span className="font-medium">{calendar.name}</span>
                          {calendar.description && (
                            <span className="text-xs text-muted-foreground">({calendar.description})</span>
                          )}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                        />
                      </label>
                    ))}
                  </div>

                  {/* Selected Tags */}
                  {selectedCalendarIds.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Seçilen Takvimler:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCalendarIds.map((calendarId) => {
                          const calendar = calendars.find(cal => cal.id === calendarId)
                          return calendar ? (
                            <Badge key={calendarId} variant="secondary" className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                              />
                              {calendar.name}
                              <button
                                onClick={() => handleCalendarToggle(calendarId)}
                                className="ml-1 hover:bg-muted rounded-full w-4 h-4 flex items-center justify-center"
                                disabled={selectedCalendarIds.length === 1}
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveCalendarSelection}
                    disabled={isUpdatingCalendars || selectedCalendarIds.length === 0}
                    className="w-full"
                  >
                    {isUpdatingCalendars && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Takvim Seçimini Kaydet ({selectedCalendarIds.length} takvim)
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Seçilen tüm takvimler ile senkronizasyon yapılacak. En az bir takvim seçili olmalı.
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
                    <div className="text-2xl font-bold text-green-600">{syncStats.synced}</div>
                    <div className="text-sm text-muted-foreground">Senkronize</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{syncStats.pending}</div>
                    <div className="text-sm text-muted-foreground">Beklemede</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{syncStats.error}</div>
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

              {/* Two-way Sync Webhook Kurulumu */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">İki Yönlü Senkronizasyon</p>
                  <p className="text-sm text-muted-foreground">
                    Calendar'daki değişiklikleri otomatik yakala
                  </p>
                </div>
                <Button
                  onClick={handleSetupWebhook}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Webhook Kur
                </Button>
              </div>
            </>
          )}

          {/* Bilgi Notu */}
          <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="font-medium mb-1">💡 Nasıl Çalışır?</p>
            <p>
              Google Calendar entegrasyonu aktifleştirildikten sonra, yeni oluşturduğunuz 
              görevler otomatik olarak takvime etkinlik olarak eklenecektir. Görev 
              önceliklerine göre farklı renkler kullanılır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}