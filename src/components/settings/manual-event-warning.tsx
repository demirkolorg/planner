"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ManualEvent {
  id: string
  title: string
  start: string
  created: string
}

interface ManualEventWarningProps {
  plannerCalendarId: string
}

export function ManualEventWarning({ plannerCalendarId }: ManualEventWarningProps) {
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>([])
  const [hasManualEvents, setHasManualEvents] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // Manuel event'leri kontrol et
  const checkManualEvents = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/google/planner-calendar/cleanup-manual-events', {
        method: 'GET',
      })

      if (response.ok) {
        const data = await response.json()
        setHasManualEvents(data.hasManualEvents)
        setManualEvents(data.manualEvents || [])
        setWarnings(data.warnings || [])
        setLastCheck(new Date())
      } else {
        console.error('Manuel event kontrolü başarısız')
      }
    } catch (error) {
      console.error('Manuel event kontrol hatası:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Manuel event'leri temizle
  const cleanupManualEvents = async () => {
    if (!hasManualEvents) return

    setIsCleaningUp(true)
    try {
      const response = await fetch('/api/google/planner-calendar/cleanup-manual-events', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          // Başarılı temizlik
          setHasManualEvents(false)
          setManualEvents([])
          setWarnings([])
          
          // Bilgilendirme modalı göster
          alert(`✅ ${data.removed} manuel event başarıyla temizlendi.`)
        } else {
          // Kısmi başarı
          alert(`⚠️ ${data.removed} event temizlendi, ancak bazı hatalar oluştu: ${data.errors?.join(', ')}`)
        }
        
        // Kontrol tekrarla
        await checkManualEvents()
      } else {
        const errorData = await response.json()
        alert(`❌ Temizleme başarısız: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Manuel event temizleme hatası:', error)
      alert('❌ Temizleme sırasında hata oluştu')
    } finally {
      setIsCleaningUp(false)
    }
  }

  // Sayfa yüklendiğinde kontrol et
  useEffect(() => {
    if (plannerCalendarId) {
      checkManualEvents()
    }
  }, [plannerCalendarId])

  // Manuel event yoksa component'i gösterme
  if (!hasManualEvents && lastCheck) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="font-medium text-green-900 dark:text-green-100">Planner Takvimi Koruması</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            ✓ Temiz
          </Badge>
        </div>
        <p className="text-sm text-green-800 dark:text-green-200 mt-2">
          Planner Takvimi&apos;nde manuel eklenen event bulunamadı. Takvim otomatik korunuyor.
        </p>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-green-700 dark:text-green-300">
            Son kontrol: {lastCheck.toLocaleString('tr-TR')}
          </p>
          <Button
            onClick={checkManualEvents}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-950/30"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  // Manuel event varsa uyarı göster
  if (hasManualEvents) {
    return (
      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-medium text-orange-900 dark:text-orange-100">Manuel Event Tespit Edildi</h3>
              <Badge variant="destructive" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                {manualEvents.length} Event
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              {warnings.map((warning, index) => (
                <p key={index} className="text-sm text-orange-800 dark:text-orange-200">
                  • {warning}
                </p>
              ))}
            </div>

            {/* Manuel Event Listesi */}
            {manualEvents.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
                  Tespit Edilen Manuel Event&apos;ler:
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {manualEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-sm">
                      <div className="flex-1">
                        <span className="font-medium text-orange-900 dark:text-orange-100">{event.title}</span>
                        <div className="text-xs text-orange-700 dark:text-orange-300">
                          {new Date(event.start).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-orange-700 dark:text-orange-300 mb-3">
              ⚠️ Bu event&apos;ler Planner ile senkronize edilmeyecek ve çakışmalara neden olabilir.
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-center justify-between pt-3 border-t border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2">
            <Button
              onClick={cleanupManualEvents}
              disabled={isCleaningUp}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Temizleniyor...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Manuel Event&apos;leri Temizle
                </>
              )}
            </Button>
            
            <Button
              onClick={checkManualEvents}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/30"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          {lastCheck && (
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Son kontrol: {lastCheck.toLocaleString('tr-TR')}
            </p>
          )}
        </div>
      </div>
    )
  }

  // İlk yükleme durumu
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-medium text-gray-900 dark:text-gray-100">Planner Takvimi Koruması</h3>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manuel event kontrolü yapılıyor...
        </p>
        <Button
          onClick={checkManualEvents}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}