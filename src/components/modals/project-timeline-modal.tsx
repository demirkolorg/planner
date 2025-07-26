"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, User, CheckCircle, XCircle, Plus, Minus, Trash2, Edit, ArrowRight, FolderPlus, Package, FileText } from "lucide-react"

interface ProjectActivity {
  id: string
  actionType: string
  entityType: string
  entityId?: string | null
  entityName?: string | null
  oldValue?: string | null
  newValue?: string | null
  description: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

interface ProjectTimelineModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
}

// Aktivite tipine göre ikon ve renk
const getActivityIcon = (actionType: string, entityType: string) => {
  switch (actionType) {
    case "project_created":
      return { icon: FolderPlus, color: "text-green-500" }
    case "project_updated":
      return { icon: Edit, color: "text-blue-500" }
    case "project_deleted":
      return { icon: Trash2, color: "text-red-500" }
    case "section_created":
      return { icon: Plus, color: "text-green-500" }
    case "section_moved":
      return { icon: ArrowRight, color: "text-indigo-500" }
    case "section_deleted":
      return { icon: Trash2, color: "text-red-500" }
    case "task_created":
      return { icon: Plus, color: "text-green-500" }
    case "task_completed":
      return { icon: CheckCircle, color: "text-green-500" }
    case "task_uncompleted":
      return { icon: XCircle, color: "text-gray-500" }
    case "task_deleted":
      return { icon: Trash2, color: "text-red-500" }
    default:
      return { icon: Clock, color: "text-gray-500" }
  }
}

// Aktivite tipine göre etiket rengi
const getActivityBadgeVariant = (actionType: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (actionType) {
    case "project_created":
    case "section_created":
    case "task_created":
    case "task_completed":
      return "default"
    case "project_deleted":
    case "section_deleted":
    case "task_deleted":
      return "destructive"  
    case "project_updated":
    case "section_moved":
      return "secondary"
    default:
      return "outline"
  }
}

// Aktivite tipini Türkçe'ye çevir
const getActivityTypeLabel = (actionType: string): string => {
  switch (actionType) {
    case "project_created":
      return "Proje Oluşturuldu"
    case "project_updated":
      return "Proje Güncellendi"
    case "project_deleted":
      return "Proje Silindi"
    case "section_created":
      return "Bölüm Oluşturuldu"
    case "section_moved":
      return "Bölüm Taşındı"
    case "section_deleted":
      return "Bölüm Silindi"
    case "task_created":
      return "Görev Oluşturuldu"
    case "task_completed":
      return "Görev Tamamlandı"
    case "task_uncompleted":
      return "Görev Tamamlanmadı"
    case "task_deleted":
      return "Görev Silindi"
    default:
      return "Bilinmeyen"
  }
}

// Entity tipine göre ikon
const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "project":
      return Package
    case "section":
      return FolderPlus
    case "task":
      return FileText
    default:
      return Clock
  }
}

export function ProjectTimelineModal({ isOpen, onClose, projectId, projectTitle }: ProjectTimelineModalProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Aktiviteleri yükle
  const fetchActivities = useCallback(async () => {
    if (!projectId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/activities`)
      
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
  }, [projectId])

  // Modal açıldığında aktiviteleri yükle
  useEffect(() => {
    if (isOpen && projectId) {
      fetchActivities()
    }
  }, [isOpen, projectId, fetchActivities])

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
            Proje Zaman Çizelgesi
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {projectTitle}
          </p>
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
                Bu proje için henüz aktivite kaydı bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto">
              <div className="space-y-4 pr-4">
                {activities.map((activity, index) => {
                  const { icon: Icon, color } = getActivityIcon(activity.actionType, activity.entityType)
                  const EntityIcon = getEntityIcon(activity.entityType)
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
                                {activity.entityName && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <EntityIcon className="w-3 h-3" />
                                    <span className="font-medium">{activity.entityName}</span>
                                  </div>
                                )}
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