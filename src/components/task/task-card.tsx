"use client"

import React, { useState } from "react"
import { ChevronRight, ChevronDown, Flag, Tag, List, Calendar, AlertTriangle, Folder, MessageCircle, ExternalLink, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { TaskCardActions } from "./task-card-actions"
import { TaskTimelineModal } from "../modals/task-timeline-modal"
import { ApprovalActionDialog } from "../modals/approval-action-dialog"
import { SubmitForApprovalDialog } from "../modals/submit-for-approval-dialog"
import { PRIORITY_COLORS, PRIORITIES } from "@/lib/constants/priority"
import { Checkbox } from "@/components/ui/checkbox"
import { DateTimePicker } from "../shared/date-time-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AssignmentIndicator } from "@/components/ui/assignment-indicator"
import { MultiLevelAssignmentButton } from "@/components/ui/multi-level-assignment-button"
import { getTaskDateStatus, getDueDateMessage, getDateStatusColor } from "@/lib/date-utils"

interface TaskWithRelations {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  projectId?: string                             // Nullable - Calendar ve Quick Note tasks için
  sectionId?: string
  userId: string
  createdAt: string
  updatedAt: string
  level?: number
  taskType?: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE'  // Görev türü
  calendarSourceId?: string                          // Google Calendar kaynak ID'si
  quickNoteCategory?: string                         // Hızlı Not kategorisi
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  approvalMessage?: string
  approvalRequestedBy?: string
  approvalRequestedAt?: string
  approvedBy?: string
  approvedAt?: string
  project?: {
    id: string
    name: string
    emoji?: string
  }
  section?: {
    id: string
    name: string
  }
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
  assignments?: Array<{
    id: string
    assigneeId: string
    assignedBy: string
    assignedAt: string
    assignee: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    assigner: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
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
  onCopy?: (taskId: string) => void
  onMove?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateAssignment?: (taskId: string, userId: string | null) => void
  onAssignUser?: (taskId: string, userId: string) => void
  onUnassignUser?: (taskId: string, userId: string) => void
  onEdit?: (task: TaskWithRelations) => void
  onComment?: (taskId: string, taskTitle: string) => void
  onSubmitForApproval?: (taskId: string, taskTitle: string) => void
  className?: string
  isFirstInSection?: boolean
  // Hiyerarşik görünüm için yeni props
  isExpanded?: boolean
  hasChildren?: boolean
  onToggleExpanded?: () => void
  // Highlight için prop
  isHighlighted?: boolean
  // Force expand için prop
  forceExpand?: boolean
}



export const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>(({
  task,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onCopy,
  onMove,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateAssignment,
  onAssignUser,
  onUnassignUser,
  onEdit,
  onComment,
  onSubmitForApproval,
  className,
  isFirstInSection = false,
  // Hiyerarşik görünüm props
  isExpanded: externalIsExpanded,
  hasChildren: externalHasChildren,
  onToggleExpanded: externalOnToggleExpanded,
  // Highlight prop
  isHighlighted = false,
  // Force expand prop
  forceExpand = false
}, ref) => {
  // Hook'ları erken çağır (early return'den önce)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)
  const [isEditingDate, setIsEditingDate] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [isSubmitForApprovalOpen, setIsSubmitForApprovalOpen] = useState(false)
  const [editorPosition, setEditorPosition] = useState<{ x: number; y: number } | undefined>()
  const [isToggling, setIsToggling] = useState(false)
  const [optimisticCompleted, setOptimisticCompleted] = useState(task?.completed || false)
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  const { currentUser, isLoading: isUserLoading } = useCurrentUser()
  
  // Task completed state'i task prop'undan gelen değer ile senkronize et
  React.useEffect(() => {
    if (task?.completed !== undefined) {
      setOptimisticCompleted(task.completed)
    }
  }, [task?.completed])

  // TaskCard memoized - re-render optimization
  
  // Force expand useEffect with scroll
  React.useEffect(() => {
    if (forceExpand && externalIsExpanded === undefined) {
      setInternalIsExpanded(true)
      // Scroll to element after expansion
      setTimeout(() => {
        if (ref && typeof ref === 'object' && ref.current) {
          ref.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100) // Small delay to allow expansion animation
    }
  }, [forceExpand, externalIsExpanded, ref])
  
  // Task validation
  if (!task || !task.id) {
    return null
  }

  // External prop'lar varsa onları kullan, yoksa internal state'i kullan
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded
  const hasChildren = externalHasChildren !== undefined ? externalHasChildren : (task.subTasks && task.subTasks.length > 0)
  
  // Görünen completed değeri (optimistic veya gerçek)
  const displayCompleted = optimisticCompleted
  
  // Proje sayfasında mı kontrol et
  const isOnProjectPage = task.projectId && pathname.startsWith('/projects/') && pathname.includes(task.projectId)
  
  
  
  const handleToggleComplete = async () => {
    // Zaten işlem devam ediyorsa çık
    if (isToggling) return
    
    // Ana görevde tamamlanmamış alt görevler varsa tamamlanamaz
    if (task.subTasks && task.subTasks.length > 0) {
      const hasIncompleteSubTasks = task.subTasks.some(subTask => !subTask.completed)
      if (hasIncompleteSubTasks && !task.completed) {
        return // Tamamlanamaz
      }
    }
    
    // Optimistic update - UI'ı hemen güncelle
    const newCompletedState = !task.completed
    setOptimisticCompleted(newCompletedState)
    setIsToggling(true)
    
    try {
      await onToggleComplete?.(task.id)
    } catch (error) {
      // Hata durumunda geri al
      setOptimisticCompleted(task.completed)
    } finally {
      setIsToggling(false)
    }
  }

  const handleToggleExpanded = () => {
    if (externalOnToggleExpanded) {
      // Hiyerarşik modda external handler kullan - children olsun ya da olmasın çağır
      externalOnToggleExpanded()
    } else {
      // Internal state - tüm kartlar expand/collapse yapabilir
      setInternalIsExpanded(!internalIsExpanded)
    }
  }

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Atanmış kullanıcılar tarih düzenleyemez (sadece task sahibi düzenleyebilir)
    if (isAssignedUser && !isTaskOwner) {
      return
    }

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
      setIsEditingDate(false) // Hata durumunda da edit modunu kapat
    }
  }

  const handleDateCancel = () => {
    setIsEditingDate(false)
  }

  const handleTimelineOpen = () => {
    setIsTimelineOpen(true)
  }

  const handleApprovalClick = () => {
    setIsApprovalDialogOpen(true)
  }

  const handleApprovalApprove = async (message?: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          message: message
        })
      })

      if (response.ok) {
        // Sayfayı yenile veya state güncelle
        window.location.reload()
      } else {
        console.error('Onay işlemi başarısız')
      }
    } catch (error) {
      console.error('Onay işlemi sırasında hata:', error)
    } finally {
      setIsApprovalDialogOpen(false)
    }
  }

  const handleApprovalReject = async (message: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          message: message
        })
      })

      if (response.ok) {
        // Sayfayı yenile veya state güncelle
        window.location.reload()
      } else {
        console.error('Reddetme işlemi başarısız')
      }
    } catch (error) {
      console.error('Reddetme işlemi sırasında hata:', error)
    } finally {
      setIsApprovalDialogOpen(false)
    }
  }

  const handleSubmitForApprovalClick = () => {
    setIsSubmitForApprovalOpen(true)
  }

  const handleSubmitForApproval = async (message: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/submit-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        // Sayfayı yenile veya state güncelle
        window.location.reload()
      } else {
        console.error('Onaya gönderme başarısız')
      }
    } catch (error) {
      console.error('Onaya gönderme sırasında hata:', error)
    } finally {
      setIsSubmitForApprovalOpen(false)
    }
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

    // All-day event tespiti: UTC'de 00:00:00 ise all-day event'tir
    const originalDateString = dateString
    const isAllDayEvent = originalDateString.includes('T00:00:00.000Z')
    
    if (isAllDayEvent) {
      return `${dateStr} (Tam Gün)`
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



  // Date status hesapla
  const dateStatus = getTaskDateStatus(task.dueDate)
  const dueDateMessage = getDueDateMessage(dateStatus, task.priority, task.dueDate)

  // Gradient background helper
  const getDateAlertGradient = () => {
    if (task.completed) return ""
    
    if (dateStatus.isOverdue) {
      return "bg-gradient-to-r from-transparent to-destructive/10 dark:to-destructive/5"
    }
    if (dateStatus.isDueToday) {
      return "bg-gradient-to-r from-transparent to-primary/10 dark:to-primary/5"
    }
    if (dateStatus.isDueTomorrow) {
      return "bg-gradient-to-r from-transparent to-secondary/20 dark:to-secondary/10"
    }
    return ""
  }

  // Tamamlanmış görevlerde tüm düzenleme işlemlerini disable et
  const isTaskCompleted = task.completed
  
  // Bu görevi atanmış kullanıcı mı görüntülüyor kontrol et
  const isAssignedUser = !isUserLoading && currentUser && task.assignments && 
    task.assignments.some(assignment => assignment.assigneeId === currentUser.id)
  
  // Task sahibi mi kontrol et
  const isTaskOwner = !isUserLoading && currentUser && task.userId === currentUser.id
  
  // Permission kontrolü için loading durumu
  const isPermissionLoading = isUserLoading

  // Onay durumu göstergesi
  const getApprovalStatusBadge = () => {
    if (!task.approvalStatus || task.approvalStatus === 'NOT_REQUIRED') {
      return null
    }

    switch (task.approvalStatus) {
      case 'PENDING':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full transition-colors",
                  isTaskOwner && "cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
                )}
                onClick={isTaskOwner ? (e) => {
                  e.stopPropagation()
                  handleApprovalClick()
                } : undefined}
              >
                <Clock className="h-3 w-3" />
                <span>Onay Bekliyor</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isTaskOwner ? 'Onay vermek için tıklayın' : 'Bu görev onay bekliyor'}</p>
            </TooltipContent>
          </Tooltip>
        )
      case 'APPROVED':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
                <CheckCircle className="h-3 w-3" />
                <span>Onaylandı</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bu görev onaylandı ve tamamlandı</p>
            </TooltipContent>
          </Tooltip>
        )
      case 'REJECTED':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full">
                <XCircle className="h-3 w-3" />
                <span>Reddedildi</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bu görev reddedildi</p>
            </TooltipContent>
          </Tooltip>
        )
      default:
        return null
    }
  }


  return (
    <TooltipProvider>
      <div 
        ref={ref}
        className={cn(
          "rounded-lg transition-all duration-200",
          isExpanded
            ? "bg-secondary rounded-t-lg"
            : "hover:bg-secondary rounded-lg",
          // Date alert gradient (only when collapsed)
        !isExpanded && getDateAlertGradient(),
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header - Always Visible */}
        <div
          className={cn(
            "flex items-center p-2 transition-colors",
            isHighlighted && "animate-pulse bg-yellow-400 dark:bg-yellow-400 shadow-lg shadow-yellow-500",
            isExpanded
              ? "hover:bg-accent/50 rounded-t-lg"
              : "hover:bg-accent/50 rounded-lg"
          )}
          style={{
            backgroundColor: isExpanded ? (getPriorityColorHex() + '1A' || '#3b82f6' + '1A') : 'transparent'
          }}
        >
          <div className="mr-2 relative">
            {(() => {
              // Tamamlanmamış alt görevler varsa disable yap
              const hasIncompleteSubTasks = task.subTasks && task.subTasks.length > 0
                ? task.subTasks.some(subTask => !subTask.completed)
                : false
              // Atanmış kullanıcılar checkbox'ı kullanamaz (sadece task sahibi kullanabilir)
              const isDisabled = (hasIncompleteSubTasks && !displayCompleted) || isToggling || 
                (isAssignedUser && !isTaskOwner)

              return (
                <>
                  <Checkbox
                    checked={displayCompleted}
                    onCheckedChange={isDisabled ? undefined : handleToggleComplete}
                    disabled={isDisabled}
                    className="peer opacity-0 absolute"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    className={cn(
                      "w-5 h-5 border-2 rounded-md flex items-center justify-center",
                      "peer-checked:text-white transition-colors",
                      displayCompleted && "text-white",
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer",
                      isToggling && "animate-pulse"
                    )}
                    style={{
                      borderColor: getPriorityColorHex() || '#ef4444', // fallback kırmızı
                      backgroundColor: displayCompleted ? (getPriorityColorHex() || '#ef4444') : 'transparent'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isDisabled) {
                        handleToggleComplete()
                      }
                    }}
                  >
                    {isToggling ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : displayCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="m11.4669 3.72684c.2683.264.2683.69.0000.95265l-6.5000 6.5c-.2641.264-.6914.264-.9555.000l-3.0000-3.0c-.2634-.264-.2634-.691.0000-.955.2635-.264.6905-.264.9540.000l2.5220 2.523 6.0220-6.023c.264-.264.691-.264.955.000z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : null}
                  </div>
                </>
              )
            })()}
          </div>


          {/* Date Time Picker - for both collapsed and expanded views */}
          {isEditingDate && (
            <DateTimePicker
              initialDateTime={task.dueDate}
              onSave={handleDateSave}
              onCancel={handleDateCancel}
              position={editorPosition}
            />
          )}

          <div 
            className="flex-1 min-w-0 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation()
              handleToggleExpanded()
            }}
          >
            <h4 className={cn(
              "font-medium text-xs truncate flex items-center gap-3 task-title",
              displayCompleted && "line-through text-muted-foreground"
            )}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">{task.title}</span>
                {getApprovalStatusBadge()}
                {/* Debug: Level bilgisi - gizli */}
                {/* <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded font-mono">
                  L{task.level}
                </span> */}
                
                {/* Project Link Button - Only show on hover and not on project page */}
                {isHovered && !isOnProjectPage && task.projectId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        href={`/projects/${task.projectId}?highlight=${task.id}`}
                        className={cn(
                          "flex-shrink-0 transition-opacity duration-200",
                          isHovered ? "opacity-100" : "opacity-0"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Projeye git</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              {/* Due Date Icon with Overdue Warning */}
              {task.dueDate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1">
                      {dateStatus.isOverdue && !task.completed ? (
                        <AlertTriangle 
                          className="h-4 w-4" 
                          style={{ color: getDateStatusColor(dateStatus.status) }}
                        />
                      ) : (
                        <Calendar 
                          className="h-4 w-4" 
                          style={{ color: getDateStatusColor(dateStatus.status) }}
                        />
                      )}
                      {dueDateMessage && (
                        <span 
                          className="text-xs font-medium"
                          style={{ color: getDateStatusColor(dateStatus.status) }}
                        >
                          {dueDateMessage}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Son tarih: {formatDateTime(task.dueDate)}</p>
                    {dueDateMessage && <p className="font-medium">{dueDateMessage}</p>}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Assignment Indicator + Assignment Button */}
              <div className="flex items-center gap-1">
                {/* Existing Assignment Indicator */}
                {task.assignments && task.assignments.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">Atanan Kişi:</p>
                        <p className="text-xs">
                          {task.assignments[0].assignee.firstName} {task.assignments[0].assignee.lastName}
                        </p>
                      </div>
                  </TooltipContent>
                </Tooltip>
              )}

                {/* Multi-level Assignment Button - Only show on hover and if has project permissions */}
                {isHovered && task.projectId && (
                  <MultiLevelAssignmentButton
                    target={{
                      id: task.id,
                      name: task.title,
                      type: 'TASK',
                      projectId: task.projectId
                    }}
                    onRefresh={() => {
                      // Refresh callback - task'ı tekrar yükle
                      if (onUpdateAssignment) {
                        // Mevcut assignment state'ini refresh et
                        onUpdateAssignment(task.id, task.assignments?.[0]?.assigneeId || null)
                      }
                    }}
                    variant="icon"
                  />
                )}
              </div>

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
                    <div className="space-y-1">
                      {task.tags.map((taskTag) => (
                        <p key={taskTag.id} className="text-xs">
                          {taskTag.tag.name}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Comments Icon and Count */}
              {task._count && task._count.comments > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{task._count.comments}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {task._count.comments} Yorum
                    </p>
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
                  <p>
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
                  </p>
                </TooltipContent>
              </Tooltip>
            </h4>
          </div>

          <div className="flex items-center ml-2 space-x-2 pointer-events-auto">
            {/* Project and Section Info */}
            {(task.project || task.section) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Folder className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {task.project && (
                      <p className="text-sm">
                        <span className="font-medium">Proje:</span> {task.project.emoji} {task.project.name}
                      </p>
                    )}
                    {task.section && (
                      <p className="text-sm">
                        <span className="font-medium">Bölüm:</span> {task.section.name}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Pin indicator */}
            {task.isPinned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-muted-foreground">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.927 5.927 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z" />
                    </svg>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sabitlenmiş</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Expand/Collapse Icon - sadece children varsa göster */}
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            )}
          </div>
        </div>


        {/* Expanded Content */}
        {isExpanded && (
          <div className={cn(
            "px-4 pb-4 ",
            getDateAlertGradient()
          )}>
            {/* Description */}
            {task.description && (
              <div className="pt-3 mb-4">
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
              {/* Left side - Date */}
              <div className="text-xs text-muted-foreground flex items-center space-x-3">
                {/* Date */}
                <div>
                  {task.dueDate ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={isTaskCompleted || isPermissionLoading || (isAssignedUser && !isTaskOwner)
                            ? "cursor-not-allowed opacity-50" 
                            : "cursor-pointer hover:text-foreground transition-colors"
                          }
                          onClick={isTaskCompleted || isPermissionLoading || (isAssignedUser && !isTaskOwner) ? undefined : handleDateClick}
                        >
                          📅 {formatDateTime(task.dueDate)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : 'Bitiş Tarihi'}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span>Oluşturulma: {formatDate(task.createdAt)}</span>
                  )}
                </div>

                
                {/* Project and Section Info */}
                {(task.project || task.section) && (
                  <div className={`flex items-center space-x-2 ${isTaskCompleted ? 'opacity-50' : ''}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1 cursor-default">
                          <Folder className="h-3 w-3" />
                          <span className="text-xs">
                            {task.project?.emoji} {task.project?.name}
                            {task.project && task.section && ' • '}
                            {task.section?.name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          {task.project && (
                            <p className="text-sm">
                              <span className="font-medium">Proje:</span> {task.project.emoji} {task.project.name}
                            </p>
                          )}
                          {task.section && (
                            <p className="text-sm">
                              <span className="font-medium">Bölüm:</span> {task.section.name}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              {/* Right side - Actions */}
              <TaskCardActions
                task={task}
                onAddSubTask={onAddSubTask}
                onUpdateTags={onUpdateTags}
                onUpdatePriority={onUpdatePriority}
                onUpdateAssignment={onUpdateAssignment}
                onPin={onPin}
                onDelete={onDelete}
                onCopy={onCopy}
                onMove={onMove}
                onEdit={onEdit}
                onTimeline={handleTimelineOpen}
                onComment={onComment}
                onSubmitForApproval={handleSubmitForApprovalClick}
                onAssignUser={onAssignUser}
                onUnassignUser={onUnassignUser}
                isFirstInSection={isFirstInSection}
                isPermissionLoading={isPermissionLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline Modal */}
      <TaskTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        taskId={task.id}
        taskTitle={task.title}
      />

      {/* Approval Action Dialog */}
      {isApprovalDialogOpen && task.approvalStatus === 'PENDING' && (
        <ApprovalActionDialog
          isOpen={isApprovalDialogOpen}
          onClose={() => setIsApprovalDialogOpen(false)}
          onApprove={handleApprovalApprove}
          onReject={handleApprovalReject}
          taskTitle={task.title}
          approvalMessage={task.approvalMessage}
          requesterName={task.assignments?.[0]?.assignee?.firstName + " " + task.assignments?.[0]?.assignee?.lastName}
          requestedAt={task.approvalRequestedAt}
        />
      )}

      {/* Submit for Approval Dialog */}
      {isSubmitForApprovalOpen && (
        <SubmitForApprovalDialog
          isOpen={isSubmitForApprovalOpen}
          onClose={() => setIsSubmitForApprovalOpen(false)}
          onSubmit={handleSubmitForApproval}
          taskTitle={task.title}
        />
      )}
    </TooltipProvider>
  )
})

TaskCard.displayName = "TaskCard"