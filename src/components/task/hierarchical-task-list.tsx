"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableTaskItem } from "./sortable-task-item"
import { TaskCard } from "./task-card"
import { buildTaskHierarchy, flattenHierarchy, updateCompletionState } from "@/lib/task-hierarchy"
import { toSafeDateString } from "@/lib/date-utils"
import type { Task, TaskWithHierarchy } from "@/types/task"

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
  onMoveTask?: (taskId: string, newParentId: string | null) => void
  className?: string
  showTreeConnectors?: boolean
  enableDragAndDrop?: boolean
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
  onMoveTask,
  className = "",
  showTreeConnectors = true,
  enableDragAndDrop = true
}: HierarchicalTaskListProps) {
  // Expand/collapse state management
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set())
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  
  // Hiyerarşik task yapısını oluştur
  const hierarchicalTasks = useMemo(() => {
    return buildTaskHierarchy(tasks)
  }, [tasks])
  
  // Expand durumuna göre görünür task listesi
  const visibleTasks = useMemo(() => {
    const result = flattenHierarchy(hierarchicalTasks, expandedTaskIds)
    console.log('Flattened tasks:', result.map(t => ({ title: t.title, level: t.level })))
    console.log('Expanded IDs:', Array.from(expandedTaskIds))
    return result
  }, [hierarchicalTasks, expandedTaskIds])
  
  // Drag aktif task'ı bul
  const activeTask = activeTaskId ? visibleTasks.find(task => task.id === activeTaskId) : null
  
  // Expand/collapse toggle
  const toggleExpanded = useCallback((taskId: string) => {
    console.log('Toggling expand for task:', taskId)
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
        console.log('Collapsed task:', taskId)
      } else {
        newSet.add(taskId)
        console.log('Expanded task:', taskId)
      }
      console.log('New expanded set:', Array.from(newSet))
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
  
  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }, [])
  
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Potansiyel drop target'ları highlight edebilir
  }, [])
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)
    
    if (!over || !onMoveTask) return
    
    const activeTaskId = active.id as string
    const overTaskId = over.id as string
    
    if (activeTaskId === overTaskId) return
    
    // Over task'ın parent'ı olarak ayarla
    const overTask = visibleTasks.find(t => t.id === overTaskId)
    if (!overTask) return
    
    // Eğer over task'ın parent'ına drop ediyorsa
    if (overTask.parentTaskId) {
      onMoveTask(activeTaskId, overTask.parentTaskId)
    } else {
      // Root level'e drop ediyorsa
      onMoveTask(activeTaskId, null)
    }
  }, [visibleTasks, onMoveTask])
  
  // Eğer hiç task yoksa boş state göster
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Henüz görev bulunmuyor.</p>
      </div>
    )
  }
  
  const content = (
    <div className={`space-y-1 ${className}`}>
      <SortableContext 
        items={visibleTasks.map(task => task.id)} 
        strategy={verticalListSortingStrategy}
      >
        {visibleTasks.map((task, index) => {
          const isExpanded = expandedTaskIds.has(task.id)
          const hasChildren = task.hasChildren || false
          
          
          return enableDragAndDrop ? (
            <SortableTaskItem
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
              isDragDisabled={false}
            />
          ) : (
            <div key={task.id} className="relative">
              {/* Task Card without drag */}
              <TaskCard
                task={{
                  ...task,
                  // Task card için gerekli dönüşümler
                  dueDate: toSafeDateString(task.dueDate),
                  createdAt: toSafeDateString(task.createdAt) || '',
                  updatedAt: toSafeDateString(task.updatedAt) || '',
                  level: task.level || 0,
                  subTasks: task.children?.map(child => ({
                    id: child.id,
                    title: child.title,
                    completed: child.completed,
                    priority: child.priority,
                    createdAt: toSafeDateString(child.createdAt) || '',
                    updatedAt: toSafeDateString(child.updatedAt) || ''
                  }))
                }}
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
                className={task.level && task.level > 0 ? `ml-${task.level * 6}` : ""}
                // Tree expansion state
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                onToggleExpanded={() => toggleExpanded(task.id)}
              />
            </div>
          )
        })}
      </SortableContext>
      
      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={{
              ...activeTask,
              dueDate: toSafeDateString(activeTask.dueDate),
              createdAt: toSafeDateString(activeTask.createdAt) || '',
              updatedAt: toSafeDateString(activeTask.updatedAt) || '',
              level: 0, // Overlay'de level gösterme
            }}
            className="opacity-90 shadow-lg"
          />
        )}
      </DragOverlay>
    </div>
  )

  return enableDragAndDrop ? (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {content}
    </DndContext>
  ) : (
    content
  )
}