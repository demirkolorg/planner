"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Flag, Tag, List, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { TaskCardActions } from "./task-card-actions"
import { PRIORITY_COLORS, PRIORITIES } from "@/lib/constants/priority"
import { Checkbox } from "@/components/ui/checkbox"
import { DateTimePicker } from "../shared/date-time-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  level?: number
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
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: string[]) => void
  className?: string
  isFirstInSection?: boolean
}



export function TaskCard({
  task,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  className,
  isFirstInSection = false
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [editorPosition, setEditorPosition] = useState<{ x: number; y: number } | undefined>()

  const handleToggleComplete = () => {
    // Ana görevde tamamlanmamış alt görevler varsa tamamlanamaz
    if (task.subTasks && task.subTasks.length > 0) {
      const hasIncompleteSubTasks = task.subTasks.some(subTask => !subTask.completed)
      if (hasIncompleteSubTasks && !task.completed) {
        return // Tamamlanamaz
      }
    }
    onToggleComplete?.(task.id)
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Click pozisyonunu hesapla
    const rect = e.currentTarget.getBoundingClientRect()
    setEditorPosition({
      x: rect.left,
      y: rect.bottom + 4 // 4px margin
    })
    
    setIsEditingDate(true)
  }

  const handleDateSave = async (dateTime: string | null) => {
    try {
      // dueDate alanını Date object olarak gönder
      const updateData = dateTime ? { dueDate: new Date(dateTime) } : { dueDate: null }
      await onUpdate?.(task.id, updateData)
      setIsEditingDate(false)
    } catch (error) {
      console.error('Failed to update date:', error)
      setIsEditingDate(false) // Hata durumunda da edit modunu kapat
    }
  }

  const handleDateCancel = () => {
    setIsEditingDate(false)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short'
    })
    
    // Eğer saat 00:00 ise sadece tarihi göster
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    if (hours === 0 && minutes === 0) {
      return dateStr
    }
    
    const timeStr = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return `${dateStr} ${timeStr}`
  }


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


  // Level bazlı margin hesapla
  const getMarginByLevel = (level?: number) => {
    switch (level) {
      case 1: return "ml-6"
      case 2: return "ml-12"
      case 3: return "ml-18"
      case 4: return "ml-24"
      default: return ""
    }
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "rounded-lg  transition-all duration-200",
        task.level && task.level > 0 ? getMarginByLevel(task.level) : "",
        isExpanded 
            ? "bg-secondary rounded-t-lg" 
            : "hover:bg-secondary rounded-lg",
        className
      )}>
      {/* Header - Always Visible */}
      <div 
        className={cn(
          "flex items-center p-2 cursor-pointer transition-colors",
          isExpanded 
            ? "bg-accent/10 hover:bg-accent/50 rounded-t-lg" 
            : "hover:bg-accent/50 rounded-lg"
        )}
        onClick={handleToggleExpanded}
      >
        <div className="mr-2 relative">
          {(() => {
            // Tamamlanmamış alt görevler varsa disable yap
            const hasIncompleteSubTasks = task.subTasks && task.subTasks.length > 0 
              ? task.subTasks.some(subTask => !subTask.completed) 
              : false
            const isDisabled = hasIncompleteSubTasks && !task.completed

            return (
              <>
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={isDisabled ? undefined : handleToggleComplete}
                  disabled={isDisabled}
                  className="peer opacity-0 absolute"
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  className={cn(
                    "w-5 h-5 border-2 rounded-md flex items-center justify-center",
                    "peer-checked:text-white transition-colors",
                    task.completed && "text-white",
                    isDisabled 
                      ? "cursor-not-allowed opacity-50" 
                      : "cursor-pointer"
                  )}
                  style={{
                    borderColor: getPriorityColorHex() || '#ef4444', // fallback kırmızı
                    backgroundColor: task.completed ? (getPriorityColorHex() || '#ef4444') : 'transparent'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isDisabled) {
                      handleToggleComplete()
                    }
                  }}
                >
                  {task.completed && (
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="m11.4669 3.72684c.2683.264.2683.69.0000.95265l-6.5000 6.5c-.2641.264-.6914.264-.9555.000l-3.0000-3.0c-.2634-.264-.2634-.691.0000-.955.2635-.264.6905-.264.9540.000l2.5220 2.523 6.0220-6.023c.264-.264.691-.264.955.000z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </div>
              </>
            )
          })()}
        </div>
        
        {/* Due date - only when collapsed */}
        {!isExpanded && !isEditingDate && task.dueDate && (
          <div 
            className="text-xs text-muted-foreground px-2"
          >
            {formatDateTime(task.dueDate)}
          </div>
        )}

        {/* Date Time Picker - for both collapsed and expanded views */}
        {isEditingDate && (
          <DateTimePicker
            initialDateTime={task.dueDate}
            onSave={handleDateSave}
            onCancel={handleDateCancel}
            position={editorPosition}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-xs truncate flex items-center gap-3",
            task.completed && "line-through text-muted-foreground"
          )}>
            <span className="flex-1 min-w-0 truncate">{task.title}</span>
            {/* SubTasks Icon and Count */}
            {task.subTasks && task.subTasks.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <List className="h-4 w-4" />
                    <span className="text-xs">
                      {task.subTasks.filter(sub => sub.completed).length}/{task.subTasks.length}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {task.subTasks.filter(sub => sub.completed).length}/{task.subTasks.length} Tamamlanan Alt Görev
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Tags Icon and Count */}
            {task.tags && task.tags.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span className="text-xs">{task.tags.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-wrap gap-1">
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
                </TooltipContent>
              </Tooltip>
            )}
            {/* Reminders Icon and Count */}
            {task.reminders && task.reminders.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    <span className="text-xs">{task.reminders.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">Hatırlatıcılar:</p>
                    {task.reminders.map((reminder, index) => (
                      <p key={index} className="text-xs">
                        {new Date(reminder.datetime).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Priority Flag */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Flag 
                  className="h-4 w-4 flex-shrink-0" 
                  style={{ color: getPriorityColorHex() }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: getPriorityColorHex() + '20',
                    color: getPriorityColorHex(),
                  }}
                >
                  {(() => {
                    const priorityMapping: Record<string, string> = {
                      'HIGH': 'Yüksek',
                      'MEDIUM': 'Orta', 
                      'LOW': 'Düşük',
                      'NONE': 'Yok',
                      'CRITICAL': 'Kritik'
                    }
                    return priorityMapping[task.priority] || task.priority
                  })()}
                </span>
              </TooltipContent>
            </Tooltip>
          </h4>
        </div>

        <div className="flex items-center ml-2 space-x-2">

          {/* Pin indicator */}
          {task.isPinned && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-muted-foreground">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.927 5.927 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sabitlenmiş</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>


      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
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

          {/* Footer with Date and Actions */}
          <div className="flex items-center justify-between mt-4 pt-3">
            {/* Left side - Date and Reminders */}
            <div className="text-xs text-muted-foreground flex items-center space-x-3">
              {/* Date */}
              <div>
                {task.dueDate ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className="cursor-pointer hover:text-foreground transition-colors"
                        onClick={handleDateClick}
                      >
                        📅 {formatDateTime(task.dueDate)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bitiş Tarihi</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span>Oluşturulma: {formatDate(task.createdAt)}</span>
                )}
              </div>

              {/* Reminders */}
              {task.reminders && task.reminders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 cursor-default">
                        <span>🔔</span>
                        <span>{task.reminders.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hatırlatıcılar</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex flex-wrap gap-1">
                    {task.reminders.map((reminder, index) => (
                      <span key={index} className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 py-0.5 rounded cursor-default">
                        {new Date(reminder.datetime).toLocaleString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <TaskCardActions
              task={task}
              onAddSubTask={onAddSubTask}
              onUpdateTags={onUpdateTags}
              onUpdatePriority={onUpdatePriority}
              onUpdateReminders={onUpdateReminders}
              onPin={onPin}
              onDelete={onDelete}
              isFirstInSection={isFirstInSection}
            />
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  )
}