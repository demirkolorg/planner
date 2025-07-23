"use client"

import { useState } from "react"
import { 
  Plus, 
  Tag, 
  Flag, 
  Bell, 
  Pin, 
  MoreHorizontal,
  Trash2,
  Copy,
  Move
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
  isFirstInSection = false
}: TaskCardActionsProps) {
  const [showMoreActions, setShowMoreActions] = useState(false)

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

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1">
        {/* Add Sub-task */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAddSubTask}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Alt görev ekle</p>
          </TooltipContent>
        </Tooltip>


        {/* Tag Selector */}
        <TagSelector
          taskTags={task.tags}
          onUpdateTags={handleUpdateTags}
          dropdownPosition={isFirstInSection ? 'bottom' : 'top'}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
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
                <p>Etiket ekle</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Priority Selector */}
        <PrioritySelector
          currentPriority={task.priority}
          onUpdatePriority={handleUpdatePriority}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
                >
                  <Flag className="h-3 w-3" />
                  <div 
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
                    style={{ backgroundColor: getPriorityColorHex() }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Öncelik belirle</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Reminder Selector */}
        <ReminderSelector
          taskReminders={task.reminders}
          onUpdateReminders={handleUpdateReminders}
          dropdownPosition={isFirstInSection ? 'bottom' : 'top'}
          trigger={
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 relative"
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
                <p>Hatırlatıcı ekle</p>
              </TooltipContent>
            </Tooltip>
          }
        />

        {/* Pin/Unpin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7  ${task.isPinned ? 'text-red-500' : 'text-white'}`}
              onClick={handlePin}
            >
              <Pin className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{task.isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}</p>
          </TooltipContent>
        </Tooltip>

        {/* More Actions */}
        <DropdownMenu open={showMoreActions} onOpenChange={setShowMoreActions}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <span>Görevi düzenle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              <span>Klonla</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMove}>
              <Move className="h-4 w-4 mr-2" />
              <span>Taşı</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className="text-red-600 focus:text-red-600"
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