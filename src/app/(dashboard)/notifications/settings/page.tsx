"use client"

import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useNotificationStore } from "@/store/notificationStore"
import { toast } from "sonner"

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { settings, fetchSettings, updateSettings, isLoading } = useNotificationStore()
  const [hasChanges, setHasChanges] = useState(false)
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskAssignment: true,
    taskComments: true,
    taskStatusChanges: true,
    projectUpdates: true,
    mentionsOnly: false
  })

  // Ayarları yükle
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Settings yüklendiğinde local state'i güncelle
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        taskAssignment: settings.taskAssignment,
        taskComments: settings.taskComments,
        taskStatusChanges: settings.taskStatusChanges,
        projectUpdates: settings.projectUpdates,
        mentionsOnly: settings.mentionsOnly
      })
    }
  }, [settings])

  const handleSettingChange = (key: keyof typeof localSettings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updateSettings(localSettings)
      setHasChanges(false)
      toast.success("Bildirim ayarları güncellendi")
    } catch (error) {
      toast.error("Ayarlar güncellenirken hata oluştu")
    }
  }

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        taskAssignment: settings.taskAssignment,
        taskComments: settings.taskComments,
        taskStatusChanges: settings.taskStatusChanges,
        projectUpdates: settings.projectUpdates,
        mentionsOnly: settings.mentionsOnly
      })
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bildirim Ayarları</h1>
            <p className="text-muted-foreground">
              Bildirim tercihlerinizi yönetin
            </p>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Kaydet
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Genel Ayarlar */}
        <Card>
          <CardHeader>
            <CardTitle>Genel Bildirim Ayarları</CardTitle>
            <CardDescription>
              Bildirim kanallarınızı yönetin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">E-posta Bildirimleri</Label>
                <p className="text-sm text-muted-foreground">
                  Önemli bildirimler e-posta ile gönderilsin
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={localSettings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications">Anlık Bildirimler</Label>
                <p className="text-sm text-muted-foreground">
                  Tarayıcıda anlık bildirimler gösterilsin
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={localSettings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Görev Bildirimleri */}
        <Card>
          <CardHeader>
            <CardTitle>Görev Bildirimleri</CardTitle>
            <CardDescription>
              Görev aktiviteleri hakkında bildirim tercihleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="taskAssignment">Görev Atamaları</Label>
                <p className="text-sm text-muted-foreground">
                  Size görev atandığında bildirim al
                </p>
              </div>
              <Switch
                id="taskAssignment"
                checked={localSettings.taskAssignment}
                onCheckedChange={(checked) => handleSettingChange('taskAssignment', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="taskComments">Görev Yorumları</Label>
                <p className="text-sm text-muted-foreground">
                  Görevlerinize yorum yapıldığında bildirim al
                </p>
              </div>
              <Switch
                id="taskComments"
                checked={localSettings.taskComments}
                onCheckedChange={(checked) => handleSettingChange('taskComments', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="taskStatusChanges">Durum Değişiklikleri</Label>
                <p className="text-sm text-muted-foreground">
                  Görev durumu değiştiğinde bildirim al
                </p>
              </div>
              <Switch
                id="taskStatusChanges"
                checked={localSettings.taskStatusChanges}
                onCheckedChange={(checked) => handleSettingChange('taskStatusChanges', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Proje Bildirimleri */}
        <Card>
          <CardHeader>
            <CardTitle>Proje Bildirimleri</CardTitle>
            <CardDescription>
              Proje aktiviteleri hakkında bildirim tercihleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="projectUpdates">Proje Güncellemeleri</Label>
                <p className="text-sm text-muted-foreground">
                  Proje davetleri ve güncellemeler hakkında bildirim al
                </p>
              </div>
              <Switch
                id="projectUpdates"
                checked={localSettings.projectUpdates}
                onCheckedChange={(checked) => handleSettingChange('projectUpdates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Gelişmiş Ayarlar */}
        <Card>
          <CardHeader>
            <CardTitle>Gelişmiş Ayarlar</CardTitle>
            <CardDescription>
              Bildirim filtreleme ve özelleştirme seçenekleri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mentionsOnly">Sadece Bahsedilmeler</Label>
                <p className="text-sm text-muted-foreground">
                  Sadece doğrudan bahsedildiğiniz durumlar için bildirim al
                </p>
              </div>
              <Switch
                id="mentionsOnly"
                checked={localSettings.mentionsOnly}
                onCheckedChange={(checked) => handleSettingChange('mentionsOnly', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alt Kaydet Butonu */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  Kaydedilmemiş değişiklikleriniz var
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    İptal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Kaydet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}