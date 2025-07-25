"use client"

import { 
  Plus, 
  Tag, 
  Flag, 
  Bell, 
  Pin, 
  MoreHorizontal,
  Trash2,
  Copy,
  Move,
  Edit,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TagSelector } from "./tag-selector"
import { PrioritySelector } from "./priority-selector"
import { ReminderSelector } from "./reminder-selector"
import { PRIORITY_COLORS, PRIORITIES } from "@/lib/constants/priority"
import type { Task } from "@/types/task"

interface TaskCardActionsProps {
  task: Task & {
    createdAt: string
    updatedAt: string
    dueDate?: string
    tags?: Array<{
      id: string
      taskId: string
      tagId: string
      tag: {
        id: string
        name: string
        color: string
      }
    }>
    reminders?: Array<{
      id: string
      taskId: string
      datetime: Date
      message?: string
      isActive: boolean
    }>
  }
  onAddSubTask?: (taskId: string) => void
  onUpdateTags?: (taskId: string, tagIds: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: Array<{
    datetime: Date
    message?: string
    isActive?: boolean
  }>) => void
  onPin?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  onCopy?: (taskId: string) => void
  onMove?: (taskId: string) => void
  onEdit?: (task: Task & {
    createdAt: string
    updatedAt: string
    dueDate?: string
    tags?: Array<{
      id: string
      taskId: string
      tagId: string
      tag: {
        id: string
        name: string
        color: string
      }
    }>
    reminders?: Array<{
      id: string
      taskId: string
      datetime: Date
      message?: string
      isActive: boolean
    }>
  }) => void
  onTimeline?: (taskId: string, taskTitle: string) => void
  isFirstInSection?: boolean
}

export function TaskCardActions({
  task,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  onPin,
  onDelete,
  onCopy,
  onMove,
  onEdit,
  onTimeline,
  isFirstInSection = false
}: TaskCardActionsProps) {
  // DropdownMenu state'ini tamamen Radix UI'ye bırakalım
  // const [showMoreActions, setShowMoreActions] = useState(false)

  const getPriorityColorHex = () => {
    // İngilizce priority değerlerini Türkçe'ye eşleştir
    const priorityMapping: Record<string, string> = {
      'HIGH': 'Yüksek',
      'MEDIUM': 'Orta',
      'LOW': 'Düşük',
      'NONE': 'Yok',
      'CRITICAL': 'Kritik'
    }
    
    const mappedPriority = priorityMapping[task.priority] || task.priority
    const priority = PRIORITIES.find(p => p.name === mappedPriority)
    return priority?.color || PRIORITY_COLORS.YOK
  }

  const handleAddSubTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddSubTask?.(task.id)
  }


  const handleUpdateTags = (tagIds: string[]) => {
    onUpdateTags?.(task.id, tagIds)
  }

  const handleUpdatePriority = (priority: string) => {
    onUpdatePriority?.(task.id, priority)
  }

  const handleUpdateReminders = (reminders: Array<{
    datetime: Date
    message?: string
    isActive?: boolean
  }>) => {
    onUpdateReminders?.(task.id, reminders)
  }

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPin?.(task.id)
  }

  const handleDelete = () => {
    onDelete?.(task.id)
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCopy?.(task.id)
  }

  const handleMove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMove?.(task.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(task)
  }

  const handleTimeline = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTimeline?.(task.id, task.title)
  }

  // Tamamlanmış görevlerde tüm aksiyonları disable et
  const isTaskCompleted = task.completed
  
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 task-card-actions pointer-events-auto">
        {/* Add Sub-task */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={isTaskCompleted ? undefined : handleAddSubTask}
              disabled={isTaskCompleted}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : 'Alt görev ekle'}</p>
          </TooltipContent>
        </Tooltip>


        {/* Tag Selector */}
        <TagSelector
          taskTags={task.tags}
          onUpdateTags={isTaskCompleted ? undefined : handleUpdateTags}
          dropdownPosition={isFirstInSection ? 'bottom' : 'top'}
          disabled={isTaskCompleted}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                  disabled={isTaskCompleted}
                >
                  <Tag className="h-3 w-3" />
                  {task.tags && task.tags.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] rounded-full min-w-3 h-3 flex items-center justify-center px-0.5">
                      {task.tags.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : 'Etiket ekle'}</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Priority Selector */}
        <PrioritySelector
          currentPriority={task.priority}
          onUpdatePriority={isTaskCompleted ? undefined : handleUpdatePriority}
          disabled={isTaskCompleted}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                  disabled={isTaskCompleted}
                >
                  <Flag className="h-3 w-3" />
                  <div 
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
                    style={{ backgroundColor: getPriorityColorHex() }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : 'Öncelik belirle'}</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Reminder Selector */}
        <ReminderSelector
          taskReminders={task.reminders}
          onUpdateReminders={isTaskCompleted ? undefined : handleUpdateReminders}
          dropdownPosition={isFirstInSection ? 'bottom' : 'top'}
          taskDueDate={task.dueDate ? new Date(task.dueDate) : null}
          disabled={isTaskCompleted}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                  disabled={isTaskCompleted}
                >
                  <Bell className="h-3 w-3" />
                  {task.reminders && task.reminders.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] rounded-full min-w-3 h-3 flex items-center justify-center px-0.5">
                      {task.reminders.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : 'Hatırlatıcı ekle'}</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Timeline */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleTimeline}
            >
              <Clock className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zaman çizelgesi</p>
          </TooltipContent>
        </Tooltip>

        {/* Pin/Unpin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${task.isPinned ? 'text-red-500' : ''}`}
              onClick={isTaskCompleted ? undefined : handlePin}
              disabled={isTaskCompleted}
            >
              <Pin className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : (task.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle')}</p>
          </TooltipContent>
        </Tooltip>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isTaskCompleted}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={isTaskCompleted ? undefined : handleEdit} disabled={isTaskCompleted}>
              <Edit className="h-4 w-4 mr-2" />
              <span>Görevi düzenle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={isTaskCompleted ? undefined : handleCopy} disabled={isTaskCompleted}>
              <Copy className="h-4 w-4 mr-2" />
              <span>Klonla</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={isTaskCompleted ? undefined : handleMove} disabled={isTaskCompleted}>
              <Move className="h-4 w-4 mr-2" />
              <span>Taşı</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={isTaskCompleted ? undefined : (e) => {
                e.stopPropagation()
                handleDelete()
              }}
              variant="destructive"
              disabled={isTaskCompleted}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span>Görevi sil</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  )
}