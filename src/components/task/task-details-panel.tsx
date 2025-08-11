"use client"

import { useState } from "react"
import { 
  Calendar,
  Clock,
  Tag,
  Flag,
  CheckCircle2,
  Users,
  Zap,
  CalendarDays
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SimpleAssignmentButton } from "@/components/ui/simple-assignment-button"
import { SimpleDatePicker } from "@/components/ui/simple-date-picker"
import { PRIORITY_COLORS, PRIORITIES } from "@/lib/constants/priority"
import { getTaskDateStatus, getDueDateMessage, getDateStatusColor } from "@/lib/date-utils"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TaskDetailsPanelProps {
  task: any
  onTaskUpdate: (task: any) => void
}

export function TaskDetailsPanel({ task, onTaskUpdate }: TaskDetailsPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Görev tamamlama durumu değiştirme
  const handleToggleComplete = async (completed: boolean) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      if (!response.ok) throw new Error('Durum güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate(updatedTask)
      toast.success(completed ? 'Görev tamamlandı' : 'Görev yeniden açıldı')
    } catch (error: unknown) {
      toast.error('Durum güncellenirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Öncelik değiştirme
  const handlePriorityChange = async (priority: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      })

      if (!response.ok) throw new Error('Öncelik güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate(updatedTask)
      toast.success('Öncelik güncellendi')
    } catch (error: unknown) {
      toast.error('Öncelik güncellenirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Teslim tarihi değiştirme
  const handleDueDateChange = async (dueDate: Date | null) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: dueDate?.toISOString() })
      })

      if (!response.ok) throw new Error('Teslim tarihi güncellenemedi')

      const updatedTask = await response.json()
      onTaskUpdate(updatedTask)
      toast.success('Teslim tarihi güncellendi')
    } catch (error: unknown) {
      toast.error('Teslim tarihi güncellenirken hata oluştu')
    } finally {
      setIsUpdating(false)
    }
  }

  // Alt görev tamamlanma oranı
  const getSubTaskProgress = () => {
    if (!task.subTasks || task.subTasks.length === 0) return null
    
    const completedSubTasks = task.subTasks.filter((subTask: any) => subTask.completed).length
    const totalSubTasks = task.subTasks.length
    const percentage = (completedSubTasks / totalSubTasks) * 100
    
    return {
      completed: completedSubTasks,
      total: totalSubTasks,
      percentage: Math.round(percentage)
    }
  }

  const subTaskProgress = getSubTaskProgress()
  const dueDateStatus = task.dueDate ? getTaskDateStatus(task.dueDate, task.completed) : null
  const dueDateMessage = task.dueDate ? getDueDateMessage(task.dueDate, task.completed) : null

  return (
    <div className="space-y-6">
      {/* Compact Durum Section */}
      <div key="status-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Durum
          </h3>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              disabled={isUpdating || (subTaskProgress && subTaskProgress.total > 0)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">
                {task.completed ? 'Tamamlandı' : 'Devam Ediyor'}
              </div>
              {task.completed && task.updatedAt && (
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(task.updatedAt), { 
                    addSuffix: true, 
                    locale: tr 
                  })} tamamlandı
                </div>
              )}
              {subTaskProgress && subTaskProgress.total > 0 && !task.completed && (
                <div className="text-xs text-muted-foreground">
                  Önce alt görevleri tamamlayın
                </div>
              )}
            </div>
          </div>

          {/* Alt Görev İlerlemesi */}
          {subTaskProgress && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alt Görevler</span>
                <span className="font-medium">
                  {subTaskProgress.completed}/{subTaskProgress.total}
                </span>
              </div>
              <Progress value={subTaskProgress.percentage} className="h-1.5" />
              <div className="text-xs text-muted-foreground">
                %{subTaskProgress.percentage} tamamlandı
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Properties */}
      <div key="properties-section" className="space-y-4">
        {/* Öncelik */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Öncelik
          </label>
          <div className="flex-1 max-w-[140px]">
            <Select
              value={task.priority}
              onValueChange={handlePriorityChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8 text-xs border-muted-foreground/20 bg-muted/20">
                <SelectValue placeholder="Öncelik seç" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        PRIORITY_COLORS[priority.value as keyof typeof PRIORITY_COLORS]
                      )} />
                      <span className="text-xs">{priority.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Teslim Tarihi */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Teslim Tarihi
          </label>
          <div className="flex-1 max-w-[140px]">
            <SimpleDatePicker
              date={task.dueDate ? new Date(task.dueDate) : undefined}
              onSelect={(date) => handleDueDateChange(date || null)}
              placeholder="Tarih seç"
              disabled={isUpdating}
            />
          </div>
        </div>

        {dueDateStatus && dueDateMessage && (
          <div className={cn(
            "text-xs px-2 py-1 rounded-md ml-6",
            getDateStatusColor(dueDateStatus)
          )}>
            {dueDateMessage}
          </div>
        )}

        {/* Atama */}
        {task.projectId && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Atama
            </label>
            <div className="flex-1 max-w-[140px]">
              <SimpleAssignmentButton
                targetType="TASK"
                targetId={task.id}
                targetName={task.title}
                buttonVariant="outline"
                buttonClassName="w-full justify-center text-xs h-8 border-muted-foreground/20 bg-muted/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Compact Etiketler */}
      {task.tags && task.tags.length > 0 && (
        <div key="tags-section" className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Etiketler
          </label>
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((taskTag: any) => (
              <Badge 
                key={taskTag.tag.id} 
                variant="secondary"
                className="text-xs px-2 py-0.5"
                style={{ 
                  backgroundColor: `${taskTag.tag.color}15`,
                  borderColor: `${taskTag.tag.color}30`,
                  color: taskTag.tag.color
                }}
              >
                {taskTag.tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Compact Meta Bilgiler */}
      <div key="meta-section" className="space-y-2 pt-4 border-t border-border/30">
        <div key="created-at" className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Oluşturuldu
          </span>
          <span>
            {formatDistanceToNow(new Date(task.createdAt), { 
              addSuffix: true, 
              locale: tr 
            })}
          </span>
        </div>
        
        {task.updatedAt !== task.createdAt && (
          <div key="updated-at" className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Güncellendi
            </span>
            <span>
              {formatDistanceToNow(new Date(task.updatedAt), { 
                addSuffix: true, 
                locale: tr 
              })}
            </span>
          </div>
        )}

        {task.taskType && task.taskType !== 'PROJECT' && (
          <div key="task-type" className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Tür
            </span>
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
              {task.taskType === 'CALENDAR' ? 'Takvim' : 'Hızlı Not'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}