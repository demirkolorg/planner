"use client"

import { forwardRef } from "react"
import { TaskCard } from "./task-card"
import { TreeConnector } from "./tree-connector"
import { toSafeDateString } from "@/lib/date-utils"
import type { TaskWithHierarchy } from "@/types/task"

interface TaskItemProps {
  task: TaskWithHierarchy
  isExpanded: boolean
  hasChildren: boolean
  onToggleExpanded: () => void
  showTreeConnectors: boolean
  onToggleComplete?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<TaskWithHierarchy>) => void
  onDelete?: (taskId: string) => void
  onPin?: (taskId: string) => void
  onCopy?: (taskId: string) => void
  onMove?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onEdit?: (task: TaskWithHierarchy) => void
  onComment?: (taskId: string, taskTitle: string) => void
  isHighlighted?: boolean
  forceExpand?: boolean
}

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(({
  task,
  isExpanded,
  hasChildren,
  onToggleExpanded,
  showTreeConnectors,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onCopy,
  onMove,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onEdit,
  onComment,
  isHighlighted,
  forceExpand,
  ...props
}, ref) => {
  const level = task.level || 0
  const isLast = task.isLast || false


  return (
    <div
      ref={ref}
      className="relative"
      {...props}
    >
      {/* Tree connector lines */}
      {showTreeConnectors && level > 0 && (
        <TreeConnector
          level={level}
          isLast={isLast}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
        />
      )}
      
      {/* Task Card */}
      <div 
        className="transition-all duration-200"
        style={{ 
          marginLeft: level > 0 ? `${Math.min(level * 48, 192)}px` : '0px' 
        }}
      >
        <TaskCard
          task={{
            ...task,
            // Task card için gerekli dönüşümler
            dueDate: toSafeDateString(task.dueDate),
            createdAt: toSafeDateString(task.createdAt) || '',
            updatedAt: toSafeDateString(task.updatedAt) || '',
            level: level,
            subTasks: task.children?.map(child => ({
              id: child.id,
              title: child.title,
              completed: child.completed,
              priority: child.priority,
              createdAt: toSafeDateString(child.createdAt) || '',
              updatedAt: toSafeDateString(child.updatedAt) || ''
            }))
          }}
          onToggleComplete={onToggleComplete}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onPin={onPin}
          onCopy={onCopy}
          onMove={onMove}
          onAddSubTask={onAddSubTask}
          onUpdateTags={onUpdateTags}
          onUpdatePriority={onUpdatePriority}
          onEdit={onEdit}
          onComment={onComment}
          // Tree expansion state
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpanded={onToggleExpanded}
          // Highlight state
          isHighlighted={isHighlighted}
          // Force expand state
          forceExpand={forceExpand}
        />
      </div>
    </div>
  )
})

TaskItem.displayName = "TaskItem"