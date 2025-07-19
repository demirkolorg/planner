"use client"

import { useState } from "react"
import { 
  Plus, 
  Paperclip, 
  Tag, 
  Flag, 
  Bell, 
  Pin, 
  MoreHorizontal,
  Trash2
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
    attachments?: Array<{
      id: string
      taskId: string
      fileName: string
      fileType: string
      fileUrl: string
      fileSize?: number
    }>
  }
  onAddSubTask?: (taskId: string) => void
  onAddAttachment?: (taskId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: string[]) => void
  onPin?: (taskId: string) => void
  onDelete?: (taskId: string) => void
}

export function TaskCardActions({
  task,
  onAddSubTask,
  onAddAttachment,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  onPin,
  onDelete
}: TaskCardActionsProps) {
  const [showMoreActions, setShowMoreActions] = useState(false)

  const handleAddSubTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddSubTask?.(task.id)
  }

  const handleAddAttachment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddAttachment?.(task.id)
  }

  const handleUpdateTags = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Open tag selection dropdown
    onUpdateTags?.(task.id, [])
  }

  const handleUpdatePriority = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Open priority selection dropdown
    onUpdatePriority?.(task.id, task.priority)
  }

  const handleUpdateReminders = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Open reminder selection dropdown
    onUpdateReminders?.(task.id, [])
  }

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPin?.(task.id)
  }

  const handleDelete = () => {
    onDelete?.(task.id)
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

        {/* Add Attachment */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAddAttachment}
            >
              <Paperclip className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dosya ekle</p>
          </TooltipContent>
        </Tooltip>

        {/* Add/Edit Tags */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleUpdateTags}
            >
              <Tag className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Etiket ekle</p>
          </TooltipContent>
        </Tooltip>

        {/* Update Priority */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleUpdatePriority}
            >
              <Flag className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Öncelik belirle</p>
          </TooltipContent>
        </Tooltip>

        {/* Add/Edit Reminders */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleUpdateReminders}
            >
              <Bell className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hatırlatıcı ekle</p>
          </TooltipContent>
        </Tooltip>

        {/* Pin/Unpin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${task.isPinned ? 'text-orange-600' : ''}`}
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
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <span>Kopyala</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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