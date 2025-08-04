"use client"

import { useEffect, useState, useCallback } from "react"
import { StickyNote, Plus } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { TaskCard } from "@/components/task/task-card"
import { Button } from "@/components/ui/button"
import { QuickTaskModal } from "@/components/modals/quick-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskCommentsModal } from "@/components/modals/task-comments-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"

export default function QuickNotesPage() {
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false)
  
  // Modal states
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; subTaskCount: number } | null>(null)
  const [isTaskMoveModalOpen, setIsTaskMoveModalOpen] = useState(false)
  const [taskToMove, setTaskToMove] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isTaskCloneModalOpen, setIsTaskCloneModalOpen] = useState(false)
  const [taskToClone, setTaskToClone] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [commentsModalTask, setCommentsModalTask] = useState<{ id: string; title: string; completed: boolean } | null>(null)
  
  const { 
    getQuickNoteTasks, 
    fetchTasks, 
    toggleTaskComplete, 
    updateTask, 
    deleteTask: deleteTaskFromStore, 
    toggleTaskPin,
    updateTaskTags,
    cloneTask,
    moveTask,
    refreshTaskCommentCount,
  } = useTaskStore()

  const { projects, fetchProjects } = useProjectStore()
  const { fetchTags } = useTagStore()

  const quickNoteTasks = getQuickNoteTasks()

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProjects(),
      fetchTags()
    ]).catch(error => {
      console.error('Failed to fetch quick notes data:', error)
    })
  }, [fetchTasks, fetchProjects, fetchTags])

  const handleAddQuickNote = () => {
    setIsQuickTaskModalOpen(true)
  }

  const handleTaskCreated = async () => {
    await fetchTasks()
  }

  // Handler functions
  const handleCommentTask = useCallback((taskId: string, taskTitle: string) => {
    const task = quickNoteTasks.find(t => t.id === taskId)
    setCommentsModalTask({ id: taskId, title: taskTitle, completed: task?.completed || false })
    setIsCommentsModalOpen(true)
  }, [quickNoteTasks])

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = quickNoteTasks.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ id: taskId, title: task.title, subTaskCount })
      setIsTaskDeleteDialogOpen(true)
    }
  }, [quickNoteTasks])

  const handleCloneTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      setIsTaskCloneModalOpen(false)
      setTaskToClone(null)
      
      const [cloneResult] = await Promise.allSettled([
        cloneTask(taskId, targetProjectId, targetSectionId)
      ])
      
      if (cloneResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Clone failed:', cloneResult.reason)
      }
    } catch (error) {
      console.error('Failed to clone task:', error)
    }
  }, [cloneTask, fetchTasks])

  const handleMoveTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      setIsTaskMoveModalOpen(false)
      setTaskToMove(null)
      
      const [moveResult] = await Promise.allSettled([
        moveTask(taskId, targetProjectId, targetSectionId)
      ])
      
      if (moveResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Move failed:', moveResult.reason)
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }, [moveTask, fetchTasks])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskToCopy = quickNoteTasks.find(t => t.id === taskId)
    if (taskToCopy) {
      setTaskToClone({
        id: taskId,
        title: taskToCopy.title,
        projectId: taskToCopy.projectId || '',
        sectionId: undefined
      })
      setIsTaskCloneModalOpen(true)
    }
  }, [quickNoteTasks])

  const handleMoveTaskModal = useCallback((taskId: string) => {
    const taskToMoveItem = quickNoteTasks.find(t => t.id === taskId)
    if (taskToMoveItem) {
      setTaskToMove({
        id: taskId,
        title: taskToMoveItem.title,
        projectId: taskToMoveItem.projectId || '',
        sectionId: undefined
      })
      setIsTaskMoveModalOpen(true)
    }
  }, [quickNoteTasks])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
          <StickyNote className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Hızlı Notlar</h1>
          <p className="text-sm text-muted-foreground">
            Hızlı not tarzı görevler ve hatırlatmalar
          </p>
        </div>
        <Button onClick={handleAddQuickNote}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Hızlı Not
        </Button>
      </div>

      {/* Tasks List */}
      {quickNoteTasks.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-muted rounded-lg">
          <div className="p-4 rounded-lg mx-auto mb-4 w-fit bg-muted/50">
            <StickyNote className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Henüz hızlı not yok
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            İlk hızlı notunuzu ekleyerek başlayın
          </p>
          <Button onClick={handleAddQuickNote} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            İlk Hızlı Notu Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {quickNoteTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={toggleTaskComplete}
              onUpdate={updateTask}
              onDelete={handleDeleteTask}
              onPin={toggleTaskPin}
              onUpdateTags={updateTaskTags}
              onEdit={() => {}}
              onCopy={handleCopyTask}
              onMove={handleMoveTaskModal}
              onComment={handleCommentTask}
              className="hover:shadow-sm transition-shadow"
            />
          ))}
        </div>
      )}
      
      {/* Quick Task Modal for Quick Notes */}
      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Modals */}
      <TaskDeleteDialog
        isOpen={isTaskDeleteDialogOpen}
        onClose={() => {
          setIsTaskDeleteDialogOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={async () => {
          if (taskToDelete) {
            try {
              await deleteTaskFromStore(taskToDelete.id)
              await fetchTasks()
              setIsTaskDeleteDialogOpen(false)
              setTaskToDelete(null)
            } catch (error) {
              console.error('Failed to delete task:', error)
            }
          }
        }}
        task={taskToDelete}
      />

      <MoveTaskModal
        isOpen={isTaskCloneModalOpen}
        onClose={() => {
          setIsTaskCloneModalOpen(false)
          setTaskToClone(null)
        }}
        onMove={handleCloneTask}
        task={taskToClone}
        mode="clone"
      />

      <MoveTaskModal
        isOpen={isTaskMoveModalOpen}
        onClose={() => {
          setIsTaskMoveModalOpen(false)
          setTaskToMove(null)
        }}
        onMove={handleMoveTask}
        task={taskToMove}
      />

      <TaskCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false)
          setCommentsModalTask(null)
        }}
        taskId={commentsModalTask?.id || ''}
        taskTitle={commentsModalTask?.title || ''}
        isTaskCompleted={commentsModalTask?.completed || false}
        onCommentAdded={() => {
          if (commentsModalTask?.id) {
            refreshTaskCommentCount(commentsModalTask.id)
          }
        }}
      />
    </div>
  )
}