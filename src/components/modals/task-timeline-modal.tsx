"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, User, CheckCircle, XCircle, Star, StarOff, Calendar, Tag, ArrowRight, Plus, Minus, Trash2, Edit, Bell, Copy } from "lucide-react"

interface TaskActivity {
  id: string
  actionType: string
  oldValue?: string | null
  newValue?: string | null
  description: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

interface TaskTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
}

// Aktivite tipine göre ikon ve renk
const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case "created":
      return { icon: Plus, color: "text-green-500" }
    case "updated":
      return { icon: Edit, color: "text-blue-500" }
    case "completed":
      return { icon: CheckCircle, color: "text-green-500" }
    case "uncompleted":
      return { icon: XCircle, color: "text-gray-500" }
    case "priority_changed":
      return { icon: ArrowRight, color: "text-orange-500" }
    case "tag_added":
      return { icon: Tag, color: "text-purple-500" }
    case "tag_removed":
      return { icon: Minus, color: "text-red-500" }
    case "due_date_changed":
      return { icon: Calendar, color: "text-blue-500" }
    case "pinned":
      return { icon: Star, color: "text-yellow-500" }
    case "unpinned":
      return { icon: StarOff, color: "text-gray-500" }
    case "moved":
      return { icon: ArrowRight, color: "text-indigo-500" }
    case "deleted":
      return { icon: Trash2, color: "text-red-500" }
    case "subtask_added":
      return { icon: Plus, color: "text-green-500" }
    case "reminder_added":
      return { icon: Bell, color: "text-blue-500" }
    case "reminder_removed":
      return { icon: Minus, color: "text-red-500" }
    case "cloned":
      return { icon: Copy, color: "text-purple-500" }
    case "title_changed":
    case "description_changed":
      return { icon: Edit, color: "text-blue-500" }
    default:
      return { icon: Clock, color: "text-gray-500" }
  }
}

// Aktivite tipine göre etiket rengi
const getActivityBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (actionType) {
    case "created":
    case "completed":
      return "default"
    case "deleted":
      return "destructive"  
    case "tag_added":
    case "pinned":
      return "secondary"
    default:
      return "outline"
  }
}

// Aktivite tipini Türkçe'ye çevir
const getActivityTypeLabel = (actionType: string): string => {
  switch (actionType) {
    case "created":
      return "Oluşturuldu"
    case "updated":
      return "Güncellendi"
    case "completed":
      return "Tamamlandı"
    case "uncompleted":
      return "Tamamlanmadı"
    case "priority_changed":
      return "Öncelik Değişti"
    case "tag_added":
      return "Etiket Eklendi"
    case "tag_removed":
      return "Etiket Kaldırıldı"
    case "due_date_changed":
      return "Tarih Değişti"
    case "pinned":
      return "Sabitlendi"
    case "unpinned":
      return "Sabitleme Kaldırıldı"
    case "moved":
      return "Taşındı"
    case "deleted":
      return "Silindi"
    case "subtask_added":
      return "Alt Görev Eklendi"
    case "reminder_added":
      return "Hatırlatıcı Eklendi"
    case "reminder_removed":
      return "Hatırlatıcı Kaldırıldı"
    case "cloned":
      return "Klonlandı"
    case "title_changed":
      return "Başlık Değişti"
    case "description_changed":
      return "Açıklama Değişti"
    default:
      return "Bilinmeyen"
  }
}

export function TaskTimelineModal({ isOpen, onClose, taskId, taskTitle }: TaskTimelineModalProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Aktiviteleri yükle
  const fetchActivities = useCallback(async () => {
    if (!taskId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/activities`)
      
      if (!response.ok) {
        throw new Error("Aktiviteler yüklenemedi")
      }
      
      const data = await response.json()
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // Modal açıldığında aktiviteleri yükle
  useEffect(() => {
    if (isOpen && taskId) {
      fetchActivities()
    }
  }, [isOpen, taskId, fetchActivities])

  // Tarihi formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Az önce"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} gün önce`
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Görev Zaman Çizelgesi
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {taskTitle}
          </p>
          <DialogDescription className="sr-only">
            Görev zaman çizelgesi penceresi: {taskTitle} görevi için aktivite geçmişini görüntüleme
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchActivities}>
                Tekrar Dene
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Bu görev için henüz aktivite kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-4 pr-4">
                {activities.map((activity, index) => {
                  const { icon: Icon, color } = getActivityIcon(activity.actionType)
                  const isLast = index === activities.length - 1

                  return (
                    <div key={activity.id} className="relative">
                      {/* Timeline çizgisi */}
                      {!isLast && (
                        <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                      )}
                      
                      <div className="flex gap-3">
                        {/* İkon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        {/* İçerik */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getActivityBadgeVariant(activity.actionType)} className="text-xs">
                                  {getActivityTypeLabel(activity.actionType)}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{activity.user.firstName} {activity.user.lastName}</span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-foreground mb-1">
                                {activity.description}
                              </p>
                              
                              <p className="text-xs text-muted-foreground">
                                {formatDate(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}