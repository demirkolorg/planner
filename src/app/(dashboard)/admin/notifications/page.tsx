"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Play, BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { triggerDueDateCheck, getDueDateCheckStatus } from "@/lib/notification-jobs"

interface DueDateCheckStats {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  stats: {
    tasksDueSoon: number
    notificationsLast24h: number
  }
}

interface DueDateCheckResult {
  success: boolean
  message: string
  results: {
    total: number
    processed: number
    failed: number
    notifications: any[]
    errors: string[]
  }
  timestamp: string
}

export default function AdminNotificationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DueDateCheckStats | null>(null)
  const [lastResult, setLastResult] = useState<DueDateCheckResult | null>(null)

  const loadStats = async () => {
    try {
      const result = await getDueDateCheckStatus()
      setStats(result)
    } catch (error) {
      console.error('Failed to load stats:', error)
      toast.error("İstatistikler yüklenemedi")
    }
  }

  const handleTriggerDueDateCheck = async () => {
    setIsLoading(true)
    try {
      const result = await triggerDueDateCheck()
      setLastResult(result)
      
      // Stats'ları yenile
      await loadStats()
      
      toast.success(`${result.results.processed} bildirim oluşturuldu`)
    } catch (error) {
      console.error('Failed to trigger due date check:', error)
      toast.error("Due date check tetiklenemedi")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bildirim Yönetimi</h1>
          <p className="text-muted-foreground">
            Otomatik bildirim sistemlerini yönetin ve izleyin
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Due Date Check Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Teslim Tarihi Bildirimleri
          </CardTitle>
          <CardDescription>
            Vadesi yaklaşan görevler için otomatik bildirim sistemi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  stats.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="text-sm text-muted-foreground">Sistem Durumu</p>
                  <p className="font-medium">
                    {stats.status === 'healthy' ? 'Sağlıklı' : 'Sorunlu'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Vadesi Yaklaşan</p>
                  <p className="font-medium">{stats.stats.tasksDueSoon} görev</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Son 24 Saat</p>
                  <p className="font-medium">{stats.stats.notificationsLast24h} bildirim</p>
                </div>
              </div>
            </div>
          )}
          
          <Separator />
          
          <div className="flex gap-3">
            <Button 
              onClick={handleTriggerDueDateCheck}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isLoading ? 'Çalıştırılıyor...' : 'Manuel Çalıştır'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Son Çalıştırma Sonucu
            </CardTitle>
            <CardDescription>
              {new Date(lastResult.timestamp).toLocaleString('tr-TR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Görev</p>
                <p className="text-2xl font-bold">{lastResult.results.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">İşlenen</p>
                <p className="text-2xl font-bold text-green-600">{lastResult.results.processed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Başarısız</p>
                <p className="text-2xl font-bold text-red-600">{lastResult.results.failed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bildirimler</p>
                <p className="text-2xl font-bold text-blue-600">{lastResult.results.notifications.length}</p>
              </div>
            </div>

            {lastResult.results.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">Hatalar:</h4>
                <div className="space-y-1">
                  {lastResult.results.errors.map((error, index) => (
                    <Badge key={index} variant="destructive" className="block w-fit">
                      {error}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scheduled Jobs Info */}
      <Card>
        <CardHeader>
          <CardTitle>Zamanlanmış Görevler</CardTitle>
          <CardDescription>
            Production ortamında bu job'lar otomatik olarak çalışmalıdır
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Due Date Check - Normal</p>
                <p className="text-sm text-muted-foreground">Her gün saat 09:00'da</p>
              </div>
              <Badge variant="outline">0 9 * * *</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Due Date Check - Frequent</p>
                <p className="text-sm text-muted-foreground">Her 6 saatte bir</p>
              </div>
              <Badge variant="outline">0 */6 * * *</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Due Date Check - Business Hours</p>
                <p className="text-sm text-muted-foreground">Hafta içi 09:00 ve 17:00</p>
              </div>
              <Badge variant="outline">0 9,17 * * 1-5</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}