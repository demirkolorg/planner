"use client"

import { useState } from "react"
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  MoreVertical,
  Check,
  X,
  Folder,
  ChevronRight,
  Pin,
  PinOff,
  ExternalLink,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { PRIORITY_COLORS } from "@/lib/constants/priority"
import { toast } from "sonner"
import Link from "next/link"

interface TaskHeaderProps {
  task: any
  onTaskUpdate: (task: any) => void
  onBack: () => void
}

export function TaskHeader({ task, onTaskUpdate, onBack }: TaskHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [isLoading, setIsLoading] = useState(false)

  // Başlık düzenleme
  const handleSaveTitle = async () => {
    if (!editTitle.trim() || editTitle === task.title) {
      setIsEditing(false)
      setEditTitle(task.title)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() })
      })

      if (!response.ok) throw new Error('Başlık güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate(updatedTask)
      setIsEditing(false)
      toast.success('Görev başlığı güncellendi')
    } catch (error: unknown) {
      toast.error('Başlık güncellenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Görev sabitleme
  const handleTogglePin = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/pin`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Pin durumu güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate({ ...task, isPinned: updatedTask.isPinned })
      
      toast.success(
        updatedTask.isPinned ? 'Görev sabitlendi' : 'Görev sabitleme kaldırıldı'
      )
    } catch (error: unknown) {
      toast.error('Sabitleme durumu güncellenirken hata oluştu')
    }
  }

  // Görev silme
  const handleDelete = async () => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Görev silinemedi')

      toast.success('Görev silindi')
      onBack()
    } catch (error: unknown) {
      toast.error('Görev silinirken hata oluştu')
    }
  }

  // Onay durumu badge
  const getApprovalStatusBadge = () => {
    if (task.approvalStatus === 'PENDING') {
      return <Badge variant="outline" className="text-orange-600">Onay Bekliyor</Badge>
    }
    if (task.approvalStatus === 'APPROVED') {
      return <Badge variant="outline" className="text-green-600">Onaylandı</Badge>
    }
    if (task.approvalStatus === 'REJECTED') {
      return <Badge variant="outline" className="text-red-600">Reddedildi</Badge>
    }
    return null
  }

  // Öncelik rengi
  const getPriorityColor = () => {
    return PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.NONE
  }

  return (
    <TooltipProvider>
      <header className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
          <div className="flex items-center gap-3">
            {/* Compact Geri Butonu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Compact Öncelik İndikatörü */}
            <div 
              className={cn(
                "w-1 h-8 rounded-full opacity-80",
                getPriorityColor()
              )} 
            />

            {/* Compact Görev Başlığı */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle()
                      if (e.key === 'Escape') {
                        setIsEditing(false)
                        setEditTitle(task.title)
                      }
                    }}
                    className="text-lg font-semibold border-muted-foreground/20"
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    disabled={isLoading}
                    className="h-8 px-3"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setEditTitle(task.title)
                    }}
                    disabled={isLoading}
                    className="h-8 px-3"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 group">
                    <h1 
                      className="text-lg font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      {task.title}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-60 transition-opacity"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Compact Breadcrumb */}
                  {(task.project || task.section) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {task.project && (
                        <>
                          <Link 
                            href={`/projects/${task.project.id}`}
                            className="hover:text-primary flex items-center gap-1 max-w-32 truncate"
                          >
                            <Folder className="h-3 w-3 flex-shrink-0" />
                            {task.project.emoji && <span>{task.project.emoji}</span>}
                            <span className="truncate">{task.project.name}</span>
                          </Link>
                          
                          {task.section && (
                            <>
                              <ChevronRight className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-24">{task.section.name}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact Durum Badge'leri */}
            <div className="flex items-center gap-1.5">
              {task.completed && (
                <Badge className="text-xs px-2 py-1 bg-green-500/10 text-green-700 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Tamamlandı</span>
                  <span className="sm:hidden">✓</span>
                </Badge>
              )}
              
              {getApprovalStatusBadge()}
              
              {task.isPinned && (
                <Badge className="text-xs px-2 py-1 bg-amber-500/10 text-amber-700 border-amber-500/20">
                  <Pin className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Sabitli</span>
                  <span className="sm:hidden">📌</span>
                </Badge>
              )}
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Sabitleme Butonu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePin}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                {task.isPinned ? (
                  <PinOff className="h-3 w-3 text-amber-600" />
                ) : (
                  <Pin className="h-3 w-3 text-muted-foreground hover:text-amber-600" />
                )}
              </Button>

              {/* Projeye Git Butonu */}
              {task.project && (
                <Link href={`/projects/${task.project.id}?highlight=${task.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                  >
                    <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                  </Button>
                </Link>
              )}

              {/* Daha Fazla Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/50">
                    <MoreVertical className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Başlığı Düzenle
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleTogglePin}>
                    {task.isPinned ? (
                      <PinOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Pin className="h-4 w-4 mr-2" />
                    )}
                    {task.isPinned ? 'Sabitlemeyi Kaldır' : 'Sabitle'}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}