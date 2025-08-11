"use client"

import { useState } from "react"
import { 
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Check,
  X,
  Edit3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TaskContentPanelProps {
  task: any
  onTaskUpdate: (task: any) => void
}

interface SubTask {
  id: string
  title: string
  completed: boolean
  level: number
}

export function TaskContentPanel({ task, onTaskUpdate }: TaskContentPanelProps) {
  const [description, setDescription] = useState(task.description || "")
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false)
  const [isDescriptionSaving, setIsDescriptionSaving] = useState(false)
  const [expandedSubTasks, setExpandedSubTasks] = useState<Set<string>>(new Set())
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("")
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)

  // Açıklama kaydetme
  const handleSaveDescription = async () => {
    if (description === (task.description || "")) {
      setIsDescriptionEditing(false)
      return
    }

    try {
      setIsDescriptionSaving(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() })
      })

      if (!response.ok) throw new Error('Açıklama güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate(updatedTask)
      setIsDescriptionEditing(false)
      toast.success('Açıklama güncellendi')
    } catch (error: unknown) {
      toast.error('Açıklama güncellenirken hata oluştu')
    } finally {
      setIsDescriptionSaving(false)
    }
  }

  // Alt görev tamamlama
  const handleSubTaskToggle = async (subTaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${subTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      if (!response.ok) throw new Error('Alt görev durumu güncellenemedi')

      // Ana görevi yeniden fetch et (alt görevler dahil)
      const taskResponse = await fetch(`/api/tasks/${task.id}`)
      if (taskResponse.ok) {
        const updatedTask = await taskResponse.json()
        onTaskUpdate(updatedTask)
      }
      
      toast.success(completed ? 'Alt görev tamamlandı' : 'Alt görev yeniden açıldı')
    } catch (error: unknown) {
      toast.error('Alt görev durumu güncellenirken hata oluştu')
    }
  }

  // Yeni alt görev ekleme
  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubTaskTitle.trim(),
          projectId: task.projectId,
          sectionId: task.sectionId,
          parentTaskId: task.id,
          level: (task.level || 0) + 1
        })
      })

      if (!response.ok) throw new Error('Alt görev oluşturulamadı')

      // Ana görevi yeniden fetch et
      const taskResponse = await fetch(`/api/tasks/${task.id}`)
      if (taskResponse.ok) {
        const updatedTask = await taskResponse.json()
        onTaskUpdate(updatedTask)
      }

      setNewSubTaskTitle("")
      setIsAddingSubTask(false)
      toast.success('Alt görev eklendi')
    } catch (error: unknown) {
      toast.error('Alt görev eklenirken hata oluştu')
    }
  }

  // Alt görev genişletme/daraltma
  const toggleSubTaskExpansion = (subTaskId: string) => {
    setExpandedSubTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subTaskId)) {
        newSet.delete(subTaskId)
      } else {
        newSet.add(subTaskId)
      }
      return newSet
    })
  }

  // Hiyerarşik alt görev renderleme
  const renderSubTask = (subTask: SubTask, depth = 0) => {
    const hasChildren = task.subTasks?.some((st: SubTask) => st.parentTaskId === subTask.id)
    const isExpanded = expandedSubTasks.has(subTask.id)

    return (
      <div key={subTask.id} className={cn("space-y-2", depth > 0 && "ml-6")}>
        <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => toggleSubTaskExpansion(subTask.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <Checkbox
            checked={subTask.completed}
            onCheckedChange={(completed) => 
              handleSubTaskToggle(subTask.id, completed as boolean)
            }
          />

          <div className="flex-1">
            <span 
              className={cn(
                "text-sm",
                subTask.completed && "line-through text-muted-foreground"
              )}
            >
              {subTask.title}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-6 sm:w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Alt görevlerin çocukları */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {task.subTasks
              ?.filter((st: SubTask) => st.parentTaskId === subTask.id)
              ?.map((childSubTask: SubTask) => 
                renderSubTask(childSubTask, depth + 1)
              )}
          </div>
        )}
      </div>
    )
  }

  // Ana alt görevler (parent task'a doğrudan bağlı)
  const mainSubTasks = task.subTasks?.filter((st: SubTask) => 
    st.parentTaskId === task.id
  ) || []

  return (
    <div className="space-y-6">
      {/* Açıklama */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Açıklama
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDescriptionEditing ? (
            <div className="space-y-3">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Görev açıklamasını yazın..."
                className="min-h-24 sm:min-h-32 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setDescription(task.description || "")
                    setIsDescriptionEditing(false)
                  }
                }}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveDescription}
                  disabled={isDescriptionSaving}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Kaydet
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDescription(task.description || "")
                    setIsDescriptionEditing(false)
                  }}
                  disabled={isDescriptionSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  İptal
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="min-h-12 sm:min-h-16 p-2 sm:p-3 rounded border-2 border-dashed border-transparent hover:border-muted-foreground/20 cursor-pointer group transition-colors"
              onClick={() => setIsDescriptionEditing(true)}
            >
              {description ? (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Açıklama eklemek için tıklayın...
                </p>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Düzenle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alt Görevler */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Check className="h-4 w-4" />
              Alt Görevler
              {mainSubTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {mainSubTasks.filter(st => st.completed).length}/{mainSubTasks.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingSubTask(true)}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Alt görev listesi */}
            {mainSubTasks.length > 0 ? (
              <div className="space-y-1">
                {mainSubTasks.map((subTask: SubTask) => 
                  renderSubTask(subTask)
                )}
              </div>
            ) : (
              !isAddingSubTask && (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz alt görev yok</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingSubTask(true)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    İlk alt görevi ekle
                  </Button>
                </div>
              )
            )}

            {/* Yeni alt görev ekleme */}
            {isAddingSubTask && (
              <>
                {mainSubTasks.length > 0 && <Separator />}
                <div className="flex items-center gap-2 p-2">
                  <div className="w-4" /> {/* Indent için boşluk */}
                  <Checkbox disabled />
                  <Input
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    placeholder="Alt görev başlığı..."
                    className="flex-1 h-9 sm:h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubTask()
                      if (e.key === 'Escape') {
                        setNewSubTaskTitle("")
                        setIsAddingSubTask(false)
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddSubTask}
                    disabled={!newSubTaskTitle.trim()}
                    className="h-9 px-3 sm:h-8 sm:px-2"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewSubTaskTitle("")
                      setIsAddingSubTask(false)
                    }}
                    className="h-9 px-3 sm:h-8 sm:px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}