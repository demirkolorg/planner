"use client"

import { useState } from "react"
import { 
  FileText,
  Plus,
  Check,
  X,
  Edit3,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { HierarchicalTaskList } from "./hierarchical-task-list"
import { buildTaskHierarchy } from "@/lib/task-hierarchy"
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
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("")
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [isSubTaskSaving, setIsSubTaskSaving] = useState(false)

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

  // Alt görev tamamlama - HierarchicalTaskList için
  const handleSubTaskToggle = async (subTaskId: string) => {
    try {
      const subTask = allSubTasks.find(st => st.id === subTaskId)
      if (!subTask) return

      const response = await fetch(`/api/tasks/${subTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subTask.completed })
      })

      if (!response.ok) throw new Error('Alt görev durumu güncellenemedi')

      // Ana görevi yeniden fetch et (alt görevler dahil)
      const taskResponse = await fetch(`/api/tasks/${task.id}`)
      if (taskResponse.ok) {
        const updatedTask = await taskResponse.json()
        onTaskUpdate(updatedTask)
      }
      
      toast.success(subTask.completed ? 'Alt görev yeniden açıldı' : 'Alt görev tamamlandı')
    } catch (error: unknown) {
      toast.error('Alt görev durumu güncellenirken hata oluştu')
    }
  }

  // Yeni alt görev ekleme - HierarchicalTaskList uyumlu
  const handleAddSubTask = async (parentTaskId?: string) => {
    const targetParentId = parentTaskId || task.id
    
    if (!newSubTaskTitle.trim() || isSubTaskSaving) return

    try {
      setIsSubTaskSaving(true)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSubTaskTitle.trim(),
          projectId: task.projectId,
          sectionId: task.sectionId,
          parentTaskId: targetParentId,
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
    } finally {
      setIsSubTaskSaving(false)
    }
  }

  // Alt görevleri HierarchicalTaskList için hazırla
  const allSubTasks = task.subTasks || []
  
  // Ana alt görevler (parent task'a doğrudan bağlı)
  const mainSubTasks = allSubTasks.filter((st: SubTask) => 
    st.parentTaskId === task.id
  )

  return (
    <div className="space-y-6">
      {/* Compact Açıklama */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Açıklama
          </h3>
          {!isDescriptionEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDescriptionEditing(true)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isDescriptionEditing ? (
          <div className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Görev açıklamasını yazın..."
              className="min-h-24 resize-none border-muted-foreground/20 bg-muted/20 focus:bg-background"
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
                className="h-7 px-3 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
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
                className="h-7 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="min-h-16 p-3 rounded-lg bg-muted/20 border border-muted-foreground/10 hover:border-muted-foreground/20 cursor-pointer transition-colors"
            onClick={() => setIsDescriptionEditing(true)}
          >
            {description ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Açıklama eklemek için tıklayın...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Compact Alt Görevler */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Check className="h-4 w-4" />
            Alt Görevler
            {mainSubTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {mainSubTasks.filter(st => st.completed).length}/{mainSubTasks.length}
              </Badge>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingSubTask(true)}
            disabled={isSubTaskSaving}
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {/* Alt görev listesi - HierarchicalTaskList */}
          {allSubTasks.length > 0 ? (
            <div className="bg-muted/10 rounded-lg p-2">
              <HierarchicalTaskList
                tasks={allSubTasks}
                onToggleComplete={handleSubTaskToggle}
                onAddSubTask={handleAddSubTask}
                showTreeConnectors={true}
                className="space-y-1"
              />
            </div>
          ) : (
            !isAddingSubTask && (
              <div className="text-center py-6 text-muted-foreground bg-muted/10 rounded-lg">
                <Check className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p className="text-sm mb-2">Henüz alt görev yok</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubTask(true)}
                  disabled={isSubTaskSaving}
                  className="text-xs h-7"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  İlk alt görevi ekle
                </Button>
              </div>
            )
          )}

          {/* Yeni alt görev ekleme */}
          {isAddingSubTask && (
            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-muted-foreground/20">
              <div className="w-4" />
              <Checkbox disabled className="opacity-40" />
              <Input
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Alt görev başlığı..."
                className="flex-1 h-8 text-sm border-muted-foreground/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubTaskSaving) handleAddSubTask()
                  if (e.key === 'Escape' && !isSubTaskSaving) {
                    setNewSubTaskTitle("")
                    setIsAddingSubTask(false)
                  }
                }}
                disabled={isSubTaskSaving}
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleAddSubTask()}
                disabled={!newSubTaskTitle.trim() || isSubTaskSaving}
                className="h-8 px-2"
              >
                {isSubTaskSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewSubTaskTitle("")
                  setIsAddingSubTask(false)
                }}
                disabled={isSubTaskSaving}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}