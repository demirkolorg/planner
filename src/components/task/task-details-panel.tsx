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
import { DateTimePicker } from "../shared/date-time-picker"
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
      {/* Durum ve Tamamlama */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Durum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              disabled={isUpdating}
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
            </div>
          </div>

          {/* Alt Görev İlerlemesi */}
          {subTaskProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alt Görevler</span>
                <span className="font-medium">
                  {subTaskProgress.completed}/{subTaskProgress.total}
                </span>
              </div>
              <Progress value={subTaskProgress.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                %{subTaskProgress.percentage} tamamlandı
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Öncelik */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Öncelik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={task.priority}
            onValueChange={handlePriorityChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      PRIORITY_COLORS[priority.value as keyof typeof PRIORITY_COLORS]
                    )} />
                    {priority.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Teslim Tarihi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Teslim Tarihi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DateTimePicker
            value={task.dueDate ? new Date(task.dueDate) : null}
            onChange={handleDueDateChange}
            placeholder="Teslim tarihi seç"
            disabled={isUpdating}
          />
          
          {dueDateStatus && dueDateMessage && (
            <div className={cn(
              "text-xs px-2 py-1 rounded",
              getDateStatusColor(dueDateStatus)
            )}>
              {dueDateMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atama */}
      {task.projectId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Atama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleAssignmentButton
              targetType="TASK"
              targetId={task.id}
              targetName={task.title}
              buttonVariant="outline"
              buttonClassName="w-full justify-start"
            />
          </CardContent>
        </Card>
      )}

      {/* Etiketler */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Etiketler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.tags && task.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((taskTag: any) => (
                <Badge 
                  key={taskTag.tag.id} 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${taskTag.tag.color}20`,
                    borderColor: taskTag.tag.color,
                    color: taskTag.tag.color
                  }}
                >
                  {taskTag.tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Henüz etiket eklenmedi
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Meta Bilgiler */}
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Oluşturuldu:</span>
          <span>
            {formatDistanceToNow(new Date(task.createdAt), { 
              addSuffix: true, 
              locale: tr 
            })}
          </span>
        </div>
        
        {task.updatedAt !== task.createdAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Güncellendi:</span>
            <span>
              {formatDistanceToNow(new Date(task.updatedAt), { 
                addSuffix: true, 
                locale: tr 
              })}
            </span>
          </div>
        )}

        {task.taskType && task.taskType !== 'PROJECT' && (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Tür:</span>
            <Badge variant="outline" className="text-xs">
              {task.taskType === 'CALENDAR' ? 'Takvim Görevi' : 'Hızlı Not'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}