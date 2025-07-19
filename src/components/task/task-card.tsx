"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCardActions } from "./task-card-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { useTaskStore } from "@/store/taskStore"
import type { Task } from "@/types/task"

interface TaskWithRelations {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  projectId: string
  sectionId?: string
  userId: string
  createdAt: string
  updatedAt: string
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
  subTasks?: Array<{
    id: string
    title: string
    completed: boolean
    priority: string
    createdAt: string
    updatedAt: string
  }>
}

interface TaskCardProps {
  task: TaskWithRelations
  onToggleComplete?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<TaskWithRelations>) => void
  onDelete?: (taskId: string) => void
  onPin?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onAddAttachment?: (taskId: string, file: File) => void
  onDeleteAttachment?: (attachmentId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: string[]) => void
  className?: string
}

const PRIORITY_COLORS = {
  HIGH: "bg-red-50 dark:bg-red-900/10",
  MEDIUM: "bg-yellow-50 dark:bg-yellow-900/10", 
  LOW: "bg-blue-50 dark:bg-blue-900/10",
  NONE: "bg-gray-50 dark:bg-gray-900/10"
}

const PRIORITY_CHECKBOX_COLORS = {
  HIGH: "border-red-500 data-[state=checked]:bg-red-500",
  MEDIUM: "border-yellow-500 data-[state=checked]:bg-yellow-500",
  LOW: "border-blue-500 data-[state=checked]:bg-blue-500", 
  NONE: "border-gray-400 data-[state=checked]:bg-gray-500"
}

export function TaskCard({
  task,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onAddSubTask,
  onAddAttachment,
  onDeleteAttachment,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  className
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { getSubTasks } = useTaskStore()

  // Alt görevleri al
  const subTasks = getSubTasks(task.id)
  const hasUncompletedSubTasks = subTasks.some(subTask => !subTask.completed)
  const isMainTaskCheckboxDisabled = !task.parentTaskId && hasUncompletedSubTasks

  const handleToggleComplete = () => {
    // Üst görevse ve tamamlanmamış alt görevleri varsa tamamlanamaz
    if (isMainTaskCheckboxDisabled) return
    onToggleComplete?.(task.id)
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const priorityColor = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.NONE
  const checkboxColor = PRIORITY_CHECKBOX_COLORS[task.priority as keyof typeof PRIORITY_CHECKBOX_COLORS] || PRIORITY_CHECKBOX_COLORS.NONE

  return (
    <div className={cn(
      "rounded-lg bg-card transition-all duration-200",
      priorityColor,
      task.parentTaskId && "ml-6", // Alt görev girintisi
      className
    )}>
      {/* Header - Always Visible */}
      <div 
        className="flex items-center p-2 cursor-pointer hover:bg-accent/50"
        onClick={handleToggleExpanded}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className={cn("mr-2", checkboxColor, isMainTaskCheckboxDisabled && "opacity-50 cursor-not-allowed")}
          onClick={(e) => e.stopPropagation()}
          disabled={isMainTaskCheckboxDisabled}
        />
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-xs truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
        </div>

        <div className="flex items-center ml-1 space-x-1">
          {/* Pin indicator */}
          {task.isPinned && (
            <span className="text-xs">📌</span>
          )}

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4">
          {/* Description */}
          {task.description && (
            <div className="mt-3 mb-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.map((taskTag) => (
                <span
                  key={taskTag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: taskTag.tag.color + '20',
                    color: taskTag.tag.color,
                  }}
                >
                  {taskTag.tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2">Ekler ({task.attachments.length})</div>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="text-xs bg-muted px-2 py-1 rounded border"
                  >
                    {attachment.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Footer with Date and Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            {/* Left side - Date */}
            <div className="text-xs text-muted-foreground">
              {task.dueDate ? (
                <span>📅 {formatDate(task.dueDate)}</span>
              ) : (
                <span>Oluşturulma: {formatDate(task.createdAt)}</span>
              )}
            </div>

            {/* Right side - Actions */}
            <TaskCardActions
              task={task}
              onAddSubTask={onAddSubTask}
              onAddAttachment={onAddAttachment}
              onDeleteAttachment={onDeleteAttachment}
              onUpdateTags={onUpdateTags}
              onUpdatePriority={onUpdatePriority}
              onUpdateReminders={onUpdateReminders}
              onPin={onPin}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}
    </div>
  )
}