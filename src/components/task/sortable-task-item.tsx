"use client"

import { forwardRef } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskCard } from "./task-card"
import { TreeConnector } from "./tree-connector"
import { toSafeDateString } from "@/lib/date-utils"
import type { TaskWithHierarchy } from "@/types/task"

interface SortableTaskItemProps {
  task: TaskWithHierarchy
  isExpanded: boolean
  hasChildren: boolean
  onToggleExpanded: () => void
  showTreeConnectors: boolean
  onToggleComplete?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<TaskWithHierarchy>) => void
  onDelete?: (taskId: string) => void
  onPin?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: string[]) => void
  isDragDisabled?: boolean
}

export const SortableTaskItem = forwardRef<HTMLDivElement, SortableTaskItemProps>(({
  task,
  isExpanded,
  hasChildren,
  onToggleExpanded,
  showTreeConnectors,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  isDragDisabled = false,
  ...props
}, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
    data: {
      type: 'task',
      task: task,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const level = task.level || 0
  const isLast = task.isLast || false

  return (
    <div
      ref={setNodeRef}
      style={style}
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
      
      {/* Task Card with drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing ${level > 0 ? `ml-${level * 6}` : ""}`}
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
          onAddSubTask={onAddSubTask}
          onUpdateTags={onUpdateTags}
          onUpdatePriority={onUpdatePriority}
          onUpdateReminders={onUpdateReminders}
          // Tree expansion state
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpanded={onToggleExpanded}
        />
      </div>
    </div>
  )
})

SortableTaskItem.displayName = "SortableTaskItem"