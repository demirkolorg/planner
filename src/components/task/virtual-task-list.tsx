"use client"

import React, { memo } from 'react'
import { VirtualList } from '@/components/ui/virtual-list'
import { TaskCard } from './task-card'

interface TaskWithRelations {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  projectId?: string
  sectionId?: string
  userId: string
  createdAt: string
  updatedAt: string
  level?: number
  taskType?: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE'
  calendarSourceId?: string
  quickNoteCategory?: string
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
    targetType: 'PROJECT' | 'SECTION' | 'TASK'
    targetId: string
    userId?: string
    email?: string
    assignedBy: string
    status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
    assignedAt: string
    user?: {
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
  subTasks?: TaskWithRelations[]
  _count?: {
    comments: number
  }
}

interface VirtualTaskListProps {
  tasks: TaskWithRelations[]
  height?: number
  itemHeight?: number
  className?: string
  onToggleComplete?: (taskId: string) => void
  onUpdateTask?: (taskId: string, updates: Partial<TaskWithRelations>) => void
  onDeleteTask?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onCloneTask?: (taskId: string) => void
  onMoveTask?: (taskId: string) => void
  onTogglePin?: (taskId: string) => void
  onUpdateTags?: (taskId: string, tagIds: string[]) => void
  onSubmitForApproval?: (taskId: string) => void
  showProject?: boolean
  showSection?: boolean
  compactMode?: boolean
  updatingTasks?: Set<string> // Tasks currently being updated
}

// Memoized TaskCard wrapper for virtual list
const VirtualTaskItem = memo(({ 
  task, 
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAddSubTask,
  onCloneTask,
  onMoveTask,
  onTogglePin,
  onUpdateTags,
  onSubmitForApproval,
  showProject = true,
  showSection = true,
  compactMode = false
}: {
  task: TaskWithRelations
  onToggleComplete?: (taskId: string) => void
  onUpdateTask?: (taskId: string, updates: Partial<TaskWithRelations>) => void
  onDeleteTask?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onCloneTask?: (taskId: string) => void
  onMoveTask?: (taskId: string) => void
  onTogglePin?: (taskId: string) => void
  onUpdateTags?: (taskId: string, tagIds: string[]) => void
  onSubmitForApproval?: (taskId: string) => void
  showProject?: boolean
  showSection?: boolean
  compactMode?: boolean
}) => {
  return (
    <div className="px-2 py-1">
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onAddSubTask={onAddSubTask}
        onCloneTask={onCloneTask}
        onMoveTask={onMoveTask}
        onTogglePin={onTogglePin}
        onUpdateTags={onUpdateTags}
        onSubmitForApproval={onSubmitForApproval}
        showProject={showProject}
        showSection={showSection}
        compactMode={compactMode}
      />
    </div>
  )
}, (prevProps, nextProps) => {
  // Shallow equality check for task object
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.completed === nextProps.task.completed &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.isPinned === nextProps.task.isPinned &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.dueDate === nextProps.task.dueDate
  )
})

VirtualTaskItem.displayName = 'VirtualTaskItem'

export const VirtualTaskList = memo<VirtualTaskListProps>(({
  tasks,
  height = 600,
  itemHeight = 120, // TaskCard approximate height
  className,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onAddSubTask,
  onCloneTask,
  onMoveTask,
  onTogglePin,
  onUpdateTags,
  onSubmitForApproval,
  showProject = true,
  showSection = true,
  compactMode = false,
  updatingTasks
}) => {
  // Only enable virtual scrolling for large lists (50+ items)
  const shouldUseVirtualScrolling = tasks.length >= 50

  const renderTaskItem = (task: TaskWithRelations, index: number) => (
    <VirtualTaskItem
      key={task.id}
      task={task}
      onToggleComplete={onToggleComplete}
      onUpdateTask={onUpdateTask}
      onDeleteTask={onDeleteTask}
      onAddSubTask={onAddSubTask}
      onCloneTask={onCloneTask}
      onMoveTask={onMoveTask}
      onTogglePin={onTogglePin}
      onUpdateTags={onUpdateTags}
      onSubmitForApproval={onSubmitForApproval}
      showProject={showProject}
      showSection={showSection}
      compactMode={compactMode}
    />
  )

  // For small lists, render normally without virtualization
  if (!shouldUseVirtualScrolling) {
    return (
      <div className={`space-y-2 ${className || ''}`}>
        {tasks.map((task, index) => renderTaskItem(task, index))}
      </div>
    )
  }

  // For large lists, use virtual scrolling
  return (
    <VirtualList
      items={tasks}
      height={height}
      itemHeight={itemHeight}
      renderItem={renderTaskItem}
      className={className}
      gap={8} // Space between items
      overscan={10} // Render 10 extra items outside viewport
      getItemKey={(task) => task.id}
    />
  )
})

VirtualTaskList.displayName = 'VirtualTaskList'