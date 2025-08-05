"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PiTagSimpleFill } from "react-icons/pi"
import { Plus, Edit, Trash2, Search, Clock, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewTagModal } from "@/components/modals/new-tag-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function TagsPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<{id: string, name: string} | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority" | "project">("date")
  const [filterBy, setFilterBy] = useState<"all" | "pending" | "completed">("all")
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalContext, setTaskModalContext] = useState<{
    project?: { id: string; name: string; emoji?: string }
    section?: { id: string; name: string; projectId: string }
    parentTaskId?: string
    parentTaskTitle?: string
  }>({})
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; subTaskCount: number } | null>(null)
  const [isTaskMoveModalOpen, setIsTaskMoveModalOpen] = useState(false)
  const [taskToMove, setTaskToMove] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isTaskCloneModalOpen, setIsTaskCloneModalOpen] = useState(false)
  const [taskToClone, setTaskToClone] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const { tags, isLoading, error, fetchTags, createTag, updateTag, deleteTag, clearError } = useTagStore()
  const { 
    fetchTasksByTag, 
    getTasksByTag,
    toggleTaskComplete,
    updateTask,
    deleteTask: deleteTaskFromStore,
    toggleTaskPin,
    updateTaskTags,
    updateTaskReminders,
    showCompletedTasks,
    toggleShowCompletedTasks,
    getCompletedTasksCountByTag,
    getPendingTasksCountByTag,
    addSubTask,
    cloneTask,
    moveTask,
    fetchTasks
  } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()

  // Etiket arama filtresi
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  )

  // Seçilen tag'in görevlerini al
  const selectedTasks = selectedTagId ? getTasksByTag(selectedTagId) : []
  const selectedTag = selectedTagId ? tags.find(tag => tag.id === selectedTagId) : null

  // Arama ve filtreleme
  const filteredTasks = selectedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "pending" && !task.completed) ||
                         (filterBy === "completed" && task.completed)
    
    const matchesCompletedSetting = showCompletedTasks || !task.completed
    
    return matchesSearch && matchesFilter && matchesCompletedSetting
  })

  // Sıralama
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case "priority":
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 }
        return priorityOrder[b.priority as keyof typeof priorityOrder] - 
               priorityOrder[a.priority as keyof typeof priorityOrder]
      case "project":
        const projectA = projects.find(p => p.id === a.projectId)?.name || ""
        const projectB = projects.find(p => p.id === b.projectId)?.name || ""
        return projectA.localeCompare(projectB)
      case "date":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Handler functions
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = selectedTasks.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ id: taskId, title: task.title, subTaskCount })
      setIsTaskDeleteDialogOpen(true)
    }
  }, [selectedTasks])

  const handleCloneTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      await cloneTask(taskId, targetProjectId, targetSectionId)
      setIsTaskCloneModalOpen(false)
      setTaskToClone(null)
      if (selectedTagId) {
        await fetchTasksByTag(selectedTagId)
      }
    } catch (error) {
      console.error('Failed to clone task:', error)
    }
  }, [cloneTask, fetchTasksByTag, selectedTagId])

  const handleMoveTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      await moveTask(taskId, targetProjectId, targetSectionId)
      setIsTaskMoveModalOpen(false)
      setTaskToMove(null)
      if (selectedTagId) {
        await fetchTasksByTag(selectedTagId)
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }, [moveTask, fetchTasksByTag, selectedTagId])

  const handleAddSubTask = useCallback((parentTaskId: string) => {
    const parentTask = selectedTasks.find(t => t.id === parentTaskId)
    const project = parentTask ? projects.find(p => p.id === parentTask.projectId) : null
    
    const section = parentTask?.sectionId ? {
      id: parentTask.sectionId,
      name: 'Varsayılan',
      projectId: parentTask.projectId
    } : {
      id: 'default',
      name: 'Varsayılan',
      projectId: project?.id || ''
    }
    
    setTaskModalContext({
      project: project ? { id: project.id, name: project.name, emoji: project.emoji } : undefined,
      section: section,
      parentTaskId: parentTaskId,
      parentTaskTitle: parentTask?.title
    })
    setIsTaskModalOpen(true)
  }, [selectedTasks, projects])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskToCopy = selectedTasks.find(t => t.id === taskId)
    if (taskToCopy) {
      setTaskToClone({
        id: taskId,
        title: taskToCopy.title,
        projectId: taskToCopy.projectId,
        sectionId: undefined
      })
      setIsTaskCloneModalOpen(true)
    }
  }, [selectedTasks])

  const handleMoveTaskModal = useCallback((taskId: string) => {
    const taskToMoveItem = selectedTasks.find(t => t.id === taskId)
    if (taskToMoveItem) {
      setTaskToMove({
        id: taskId,
        title: taskToMoveItem.title,
        projectId: taskToMoveItem.projectId,
        sectionId: undefined
      })
      setIsTaskMoveModalOpen(true)
    }
  }, [selectedTasks])

  useEffect(() => {
    fetchTags()
    fetchProjects()
  }, [fetchTags, fetchProjects])

  useEffect(() => {
    if (selectedTagId) {
      fetchTasksByTag(selectedTagId)
    }
  }, [selectedTagId, fetchTasksByTag])

  // İlk tag'i otomatik seç
  useEffect(() => {
    if (filteredTags.length > 0 && !selectedTagId) {
      setSelectedTagId(filteredTags[0].id)
    }
    // Eğer seçili tag filtrelenmiş listede yoksa, boş seç
    if (selectedTagId && !filteredTags.find(tag => tag.id === selectedTagId)) {
      setSelectedTagId(filteredTags.length > 0 ? filteredTags[0].id : null)
    }
  }, [filteredTags, selectedTagId])

  const handleCreateTag = async (name: string, color: string) => {
    try {
      await createTag(name, color)
    } catch (error) {
      console.error("Failed to create tag:", error)
    }
  }

  const handleUpdateTag = async (id: string, name: string, color: string) => {
    try {
      await updateTag(id, name, color)
      setEditingTag(null)
    } catch (error) {
      console.error("Failed to update tag:", error)
    }
  }

  const handleDeleteTag = async (id: string, name: string) => {
    setTagToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTag = async () => {
    if (tagToDelete) {
      await deleteTag(tagToDelete.id)
      if (selectedTagId === tagToDelete.id) {
        setSelectedTagId(null)
      }
      setTagToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
          <PiTagSimpleFill className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Etiketler</h1>
          <p className="text-sm text-muted-foreground">
            Görev etiketlerini yönetin ve düzenleyin
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Etiket
        </Button>
      </div>

      <div className="flex h-[calc(100vh-180px)] gap-6">
        {/* Sol sütun - Tag listesi (20% genişlik) */}
        <div className="w-1/5 flex flex-col space-y-4">

          {/* Etiket arama kutusu */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Etiketlerde ara..."
              value={tagSearchQuery}
              onChange={(e) => setTagSearchQuery(e.target.value)}
              className={`pl-10 h-9 text-sm ${tagSearchQuery ? 'pr-10' : ''}`}
            />
            {tagSearchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTagSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="mt-1 h-6 text-xs"
              >
                Kapat
              </Button>
            </div>
          )}

          {/* Tag listesi */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}

            {!isLoading && tags.length === 0 && (
              <div className="text-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <PiTagSimpleFill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Henüz etiket yok</p>
                <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Yeni Etiket
                </Button>
              </div>
            )}

            {!isLoading && filteredTags.length === 0 && tags.length > 0 && (
              <div className="text-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Arama sonucu bulunamadı</p>
              </div>
            )}

            {!isLoading && filteredTags.length > 0 && filteredTags.map((tag) => (
              <div 
                key={tag.id} 
                className={`group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedTagId === tag.id 
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-200 dark:ring-blue-800' 
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                }`}
                onClick={() => setSelectedTagId(tag.id)}
                style={selectedTagId === tag.id ? {
                  background: `linear-gradient(135deg, ${tag.color}20 0%, ${tag.color}10 100%)`
                } : {}}
              >
                <div className="p-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${tag.color}25 0%, ${tag.color}45 100%)`
                      }}
                    >
                      <PiTagSimpleFill
                        className="w-3 h-3"
                        style={{ color: tag.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-xs truncate">{tag.name}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tag._count?.tasks || 0} görev
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-1.5 right-1.5 flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTag(tag.id)
                      }}
                      className="h-5 w-5 rounded-sm bg-white/90 dark:bg-gray-700/90 shadow-sm"
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTag(tag.id, tag.name)
                      }}
                      className="h-5 w-5 rounded-sm bg-red-50/90 dark:bg-red-900/40 text-red-600 shadow-sm"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ sütun - Seçilen tag'in görevleri (80% genişlik) */}
        <div className="flex-1 flex flex-col space-y-4">
          {selectedTag ? (
            <>

              {/* Filtreler ve arama */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Görevlerde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: "date" | "priority" | "project") => setSortBy(value)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Sıralama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">📅 Tarihe göre</SelectItem>
                      <SelectItem value="priority">🔥 Önceliğe göre</SelectItem>
                      <SelectItem value="project">📁 Projeye göre</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterBy} onValueChange={(value: "all" | "pending" | "completed") => setFilterBy(value)}>
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Filtrele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🔍 Tümü</SelectItem>
                      <SelectItem value="pending">⏳ Bekleyen</SelectItem>
                      <SelectItem value="completed">✅ Tamamlanan</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={showCompletedTasks ? "default" : "outline"}
                    size="sm"
                    onClick={toggleShowCompletedTasks}
                    className="h-9 px-4"
                  >
                    {showCompletedTasks ? "✅ Gizle" : "👀 Göster"}
                  </Button>
                </div>
              </div>

              {/* Görev listesi */}
              <div className="flex-1 overflow-y-auto">
                {sortedTasks.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <PiTagSimpleFill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchQuery || filterBy !== "all" 
                        ? "Arama kriterlerine uygun görev bulunamadı" 
                        : "Bu etiketle ilişkili görev yok"
                      }
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterBy !== "all"
                        ? "Farklı arama terimleri veya filtreler deneyebilirsin"
                        : "Henüz bu etiketle işaretlenmiş görev bulunmuyor"
                      }
                    </p>
                  </div>
                ) : (
                  <HierarchicalTaskList
                    tasks={sortedTasks}
                    onToggleComplete={toggleTaskComplete}
                    onUpdate={updateTask}
                    onDelete={handleDeleteTask}
                    onPin={toggleTaskPin}
                    onAddSubTask={handleAddSubTask}
                    onEdit={handleEditTask}
                    onCopy={handleCopyTask}
                    onMove={handleMoveTaskModal}
                    onUpdateTags={async (taskId, tagIds) => {
                      try {
                        await updateTaskTags(taskId, tagIds)
                      } catch (error) {
                        console.error('Failed to update tags:', error)
                      }
                    }}
                    onUpdatePriority={async (taskId, priority) => {
                      try {
                        await updateTask(taskId, { priority })
                      } catch (error) {
                        console.error('Failed to update priority:', error)
                      }
                    }}
                    onUpdateReminders={async (taskId, reminders) => {
                      try {
                        await updateTaskReminders(taskId, reminders)
                      } catch (error) {
                        console.error('Failed to update reminders:', error)
                      }
                    }}
                    showTreeConnectors={true}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <PiTagSimpleFill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bir etiket seçin</h3>
                <p className="text-muted-foreground">
                  Sol taraftan bir etiket seçerek görevlerini görebilirsiniz
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <NewTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTag}
      />

      {editingTag && (
        <NewTagModal
          isOpen={true}
          onClose={() => setEditingTag(null)}
          onSave={(name, color) => handleUpdateTag(editingTag, name, color)}
          editingTag={tags.find(tag => tag.id === editingTag) || null}
        />
      )}

      {/* Silme Onay Dialog'u */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setTagToDelete(null)
        }}
        onConfirm={confirmDeleteTag}
        title="Etiketi Sil"
        message={`"${tagToDelete?.name}" etiketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu etiketle ilişkili tüm görevlerin etiket bağlantısı kaldırılacak.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />

      {/* Task Modals */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskModalContext({})
          setEditingTask(null)
        }}
        onTaskCreated={async (newTask) => {
          try {
            if (taskModalContext.parentTaskId) {
              await addSubTask(taskModalContext.parentTaskId, newTask)
            }
            if (selectedTagId) {
              await fetchTasksByTag(selectedTagId)
            }
            setIsTaskModalOpen(false)
            setTaskModalContext({})
          } catch (error) {
            console.error('Failed to create task:', error)
          }
        }}
        defaultProject={taskModalContext.project}
        defaultSection={taskModalContext.section}
        parentTaskId={taskModalContext.parentTaskId}
        parentTaskTitle={taskModalContext.parentTaskTitle}
        editingTask={editingTask}
      />

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
              if (selectedTagId) {
                await fetchTasksByTag(selectedTagId)
              }
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
    </div>
  )
}