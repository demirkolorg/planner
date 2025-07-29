"use client"

import { useState, useCallback, useMemo } from "react"
import { TaskItem } from "./task-item"
import { buildTaskHierarchy, flattenHierarchy } from "@/lib/task-hierarchy"
import type { Task } from "@/types/task"

interface HierarchicalTaskListProps {
  tasks: Task[]
  onToggleComplete?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
  onDelete?: (taskId: string) => void
  onPin?: (taskId: string) => void
  onCopy?: (taskId: string) => void
  onMove?: (taskId: string) => void
  onAddSubTask?: (parentTaskId: string) => void
  onUpdateTags?: (taskId: string, tags: string[]) => void
  onUpdatePriority?: (taskId: string, priority: string) => void
  onUpdateReminders?: (taskId: string, reminders: string[]) => void
  onEdit?: (task: Task) => void
  onComment?: (taskId: string, taskTitle: string) => void
  className?: string
  showTreeConnectors?: boolean
  highlightTaskId?: string | null
}

export function HierarchicalTaskList({
  tasks,
  onToggleComplete,
  onUpdate,
  onDelete,
  onPin,
  onCopy,
  onMove,
  onAddSubTask,
  onUpdateTags,
  onUpdatePriority,
  onUpdateReminders,
  onEdit,
  onComment,
  className = "",
  showTreeConnectors = true,
  highlightTaskId
}: HierarchicalTaskListProps) {
  // Expand/collapse state management
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())
  
  // Hiyerarşik task yapısını oluştur
  const hierarchicalTasks = useMemo(() => {
    return buildTaskHierarchy(tasks)
  }, [tasks])
  
  // Expand durumuna göre görünür task listesi
  const visibleTasks = useMemo(() => {
    const result = flattenHierarchy(hierarchicalTasks, expandedTaskIds)
    return result
  }, [hierarchicalTasks, expandedTaskIds])
  
  // Expand/collapse toggle
  const toggleExpanded = useCallback((taskId: string) => {
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])
  
  // Completion handler with hierarchy logic
  const handleToggleComplete = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Ana toggle fonksiyonunu çağır
    onToggleComplete?.(taskId)
  }, [tasks, onToggleComplete])
  
  // Alt görev ekleme handler
  const handleAddSubTask = useCallback((parentTaskId: string) => {
    // Parent'ı otomatik expand et
    setExpandedTaskIds(prev => new Set(prev).add(parentTaskId))
    onAddSubTask?.(parentTaskId)
  }, [onAddSubTask])
  
  // Eğer hiç task yoksa boş state göster
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Henüz görev bulunmuyor.</p>
      </div>
    )
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      {visibleTasks.map((task) => {
        const isExpanded = expandedTaskIds.has(task.id)
        const hasChildren = task.hasChildren || false
        
        return (
          <TaskItem
            key={task.id}
            task={task}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onToggleExpanded={() => toggleExpanded(task.id)}
            showTreeConnectors={showTreeConnectors}
            onToggleComplete={handleToggleComplete}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onPin={onPin}
            onCopy={onCopy}
            onMove={onMove}
            onAddSubTask={handleAddSubTask}
            onUpdateTags={onUpdateTags}
            onUpdatePriority={onUpdatePriority}
            onUpdateReminders={onUpdateReminders}
            onEdit={onEdit}
            onComment={onComment}
            isHighlighted={highlightTaskId === task.id}
          />
        )
      })}
    </div>
  )
}