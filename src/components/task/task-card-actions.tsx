"use client"

import { 
  Plus, 
  Tag, 
  Flag, 
 
  Pin, 
  MoreHorizontal,
  Trash2,
  Copy,
  Move,
  Edit,
  Clock,
  MessageCircle,
  UserPlus,
  Send
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
import { SimpleAssignmentButton } from "@/components/ui/simple-assignment-button"
import { PRIORITY_COLORS, PRIORITIES } from "@/lib/constants/priority"
import { useAuthStore } from "@/store/authStore"
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
  }
  onAddSubTask?: (taskId: string) => void
  onUpdateTags?: (taskId: string, tagIds: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateAssignment?: (taskId: string, userId: string | null) => void
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
  }) => void
  onTimeline?: (taskId: string, taskTitle: string) => void
  onComment?: (taskId: string, taskTitle: string) => void
  onSubmitForApproval?: (taskId: string, taskTitle: string) => void
  onAssignUser?: (taskId: string, userId: string) => void
  onUnassignUser?: (taskId: string, userId: string) => void
  isFirstInSection?: boolean
  isPermissionLoading?: boolean
  canEditTask?: boolean
  canSubmitForApproval?: boolean
  displayPinned?: boolean // Optimistic pin state
  displayPriority?: string // Optimistic priority state
}

export function TaskCardActions({
  task,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateAssignment,
  onPin,
  onDelete,
  onCopy,
  onMove,
  onEdit,
  onTimeline,
  onComment,
  onSubmitForApproval,
  onAssignUser,
  onUnassignUser,
  isFirstInSection = false,
  isPermissionLoading = false,
  canEditTask = true,
  canSubmitForApproval = true,
  displayPinned,
  displayPriority
}: TaskCardActionsProps) {
  const { user: currentUser } = useAuthStore()
  
  // Task validation - Safety check
  if (!task || !task.id) {
    return null
  }

  // Permission loading durumu - dışarıdan gelen ve kendi loading'imizi birleştir
  const isActualPermissionLoading = isPermissionLoading // authStore'dan user hemen mevcut

  // Bu görevi atanmış kullanıcı mı görüntülüyor kontrol et
  const isAssignedUser = !isActualPermissionLoading && currentUser && task.assignments && 
    task.assignments.some((assignment: any) => assignment.userId === currentUser.id && assignment.status === 'ACTIVE')
  
  // Task sahibi mi kontrol et
  const isTaskOwner = !isActualPermissionLoading && currentUser && task.userId === currentUser.id

  const getPriorityColorHex = () => {
    // Optimistic priority değerini kullan
    const currentPriority = displayPriority ?? task.priority
    
    // İngilizce priority değerlerini Türkçe'ye eşleştir
    const priorityMapping: Record<string, string> = {
      'HIGH': 'Yüksek',
      'MEDIUM': 'Orta',
      'LOW': 'Düşük',
      'NONE': 'Yok',
      'CRITICAL': 'Kritik'
    }
    
    const mappedPriority = priorityMapping[currentPriority] || currentPriority
    const priority = PRIORITIES.find(p => p.name === mappedPriority)
    return priority?.color || PRIORITY_COLORS.YOK
  }

  const handleAddSubTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddSubTask?.(task.id)
  }

  // Level 4 ve üzeri görevlerde alt görev eklenemez
  const canAddSubTask = task.level < 4


  const handleUpdateTags = (tagIds: string[]) => {
    onUpdateTags?.(task.id, tagIds)
  }

  const handleUpdatePriority = (priority: string) => {
    onUpdatePriority?.(task.id, priority)
  }

  const handleUpdateAssignment = (userId: string | null) => {
    onUpdateAssignment?.(task.id, userId)
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

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    onComment?.(task.id, task.title)
  }

  const handleSubmitForApproval = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSubmitForApproval?.(task.id, task.title)
  }

  // Tamamlanmış görevlerde tüm aksiyonları disable et
  const isTaskCompleted = task.completed
  
  // Atanmış kullanıcı mı kontrolü - permission loading sırasında güvenli taraftan sakla
  const isDisabledForAssignedUser = isActualPermissionLoading || !canEditTask
  
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 task-card-actions pointer-events-auto">
        {/* Add Sub-task - Level 4+ görevlerde ve atanmış kullanıcılar için gizli */}
        {canAddSubTask && !isDisabledForAssignedUser && (
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
        )}


        {/* Tag Selector - Atanmış kullanıcılar için gizli */}
        {!isDisabledForAssignedUser && (
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
        )}


        {/* Priority Selector - Atanmış kullanıcılar için gizli */}
        {!isDisabledForAssignedUser && (
        <PrioritySelector
          currentPriority={displayPriority ?? task.priority}
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
        )}

        {/* Assignment Button - Öncelik ve zaman çizelgesi arasında */}
        {!isDisabledForAssignedUser && (
          <SimpleAssignmentButton
            targetType="TASK"
            targetId={task.id}
            targetName={task.title}
            onRefresh={() => {
              // Refresh callback - task'ı tekrar yükle
              if (onUpdateAssignment) {
                // Mevcut assignment state'ini refresh et
                onUpdateAssignment(task.id, task.assignments?.[0]?.userId || null)
              }
            }}
            variant="icon"
            disabled={isTaskCompleted}
          />
        )}

        {/* Timeline - Atanmış kullanıcılar için gizli */}
        {!isDisabledForAssignedUser && (
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
        )}

        {/* Comments - Her zaman görünür */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleComment}
            >
              <MessageCircle className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Yorumlar</p>
          </TooltipContent>
        </Tooltip>

        {/* Submit for Approval - Sadece atanmış kullanıcılar için görünür */}
        {!isActualPermissionLoading && canSubmitForApproval && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleSubmitForApproval}
              >
                <Send className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Onaya gönder</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Pin/Unpin - Atanmış kullanıcılar için gizli */}
        {!isDisabledForAssignedUser && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${(displayPinned ?? task.isPinned) ? 'text-red-500' : ''}`}
              onClick={isTaskCompleted ? undefined : handlePin}
              disabled={isTaskCompleted}
            >
              <Pin className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isTaskCompleted ? 'Tamamlanmış görevde düzenleme yapılamaz' : ((displayPinned ?? task.isPinned) ? 'Sabitlemeyi kaldır' : 'Sabitle')}</p>
          </TooltipContent>
        </Tooltip>
        )}

        {/* More Actions - Atanmış kullanıcılar için gizli */}
        {!isDisabledForAssignedUser && (
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
        )}
      </div>
    </TooltipProvider>
  )
}