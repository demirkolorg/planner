"use client"

import { useEffect, useState } from "react"
import { Pin, Search, FolderClosed, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import Link from "next/link"
import { useCallback } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface GroupedTasks {
  [projectId: string]: {
    project: {
      id: string
      name: string
      emoji?: string
    }
    tasks: Array<{
      id: string
      title: string
      description?: string
      completed: boolean
      priority: string
      projectId: string
      createdAt: string
    }>
  }
}

export default function PinnedTasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority" | "project">("date")
  const [filterBy, setFilterBy] = useState<"all" | "pending" | "completed">("all")
  const [editingTask, setEditingTask] = useState<{
    id: string
    title: string
    description?: string
    projectId: string
    sectionId: string
    priority: string
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
    reminders?: Array<{
      id: string
      taskId: string
      datetime: Date
      message?: string
      isActive: boolean
    }>
  } | null>(null)
  
  const { 
    fetchTasks, 
    getPinnedTasks, 
    toggleTaskComplete, 
    updateTask, 
    deleteTask, 
    toggleTaskPin,
    uploadAttachment,
    deleteAttachment,
    updateTaskTags,
    updateTaskReminders,
    showCompletedTasks,
    toggleShowCompletedTasks
  } = useTaskStore()
  
  const { projects, fetchProjects } = useProjectStore()

  // Sabitlenmiş görevleri al
  const pinnedTasks = getPinnedTasks()

  // Arama ve filtreleme
  const filteredTasks = pinnedTasks.filter(task => {
    // Arama filtresi
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Durum filtresi
    const matchesFilter = filterBy === "all" || 
                         (filterBy === "pending" && !task.completed) ||
                         (filterBy === "completed" && task.completed)
    
    // Tamamlanan görevler ayarı
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

  // Projeye göre gruplama
  const groupedTasks: GroupedTasks = sortedTasks.reduce((groups, task) => {
    const project = projects.find(p => p.id === task.projectId)
    if (!project) return groups
    
    if (!groups[task.projectId]) {
      groups[task.projectId] = {
        project: {
          id: project.id,
          name: project.name,
          emoji: project.emoji
        },
        tasks: []
      }
    }
    
    groups[task.projectId].tasks.push(task)
    return groups
  }, {} as GroupedTasks)

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [fetchTasks, fetchProjects])

  // Task edit handler
  const handleEditTask = useCallback((task: {
    id: string
    title: string
    description?: string
    projectId: string
    sectionId: string
    priority: string
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
    reminders?: Array<{
      id: string
      taskId: string
      datetime: Date
      message?: string
      isActive: boolean
    }>
  }) => {
    setEditingTask(task)
  }, [])

  // İstatistikler
  const totalPinned = pinnedTasks.length
  const completedPinned = pinnedTasks.filter(task => task.completed).length
  const pendingPinned = totalPinned - completedPinned

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
            <Pin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              Sabitlenmiş Görevler
            </h1>
            <p className="text-sm text-muted-foreground">
              Tüm projelerden sabitlenmiş görevlerin listesi
            </p>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-2 bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30 rounded-lg">
            <Pin className="h-4 w-4 text-orange-600" />
            <span className="text-lg font-bold text-orange-600">{totalPinned}</span>
            <span className="text-xs text-orange-700 dark:text-orange-300">toplam</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30 rounded-lg">
            <span className="text-green-600 font-bold">✓</span>
            <span className="text-lg font-bold text-green-600">{completedPinned}</span>
            <span className="text-xs text-green-700 dark:text-green-300">tamamlanan</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-lg">
            <span className="text-blue-600">⏳</span>
            <span className="text-lg font-bold text-blue-600">{pendingPinned}</span>
            <span className="text-xs text-blue-700 dark:text-blue-300">bekleyen</span>
          </div>
        </div>
      </div>

      {/* Compact Filters and Search */}
      <div className="bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Görevlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 rounded-lg border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: "date" | "priority" | "project") => setSortBy(value)}>
              <SelectTrigger className="w-40 h-9 rounded-lg border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200">
                <SelectValue placeholder="Sıralama" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-gray-200/60 dark:border-gray-700/60">
                <SelectItem value="date">📅 Tarihe göre</SelectItem>
                <SelectItem value="priority">🔥 Önceliğe göre</SelectItem>
                <SelectItem value="project">📁 Projeye göre</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: "all" | "pending" | "completed") => setFilterBy(value)}>
              <SelectTrigger className="w-32 h-9 rounded-lg border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all duration-200">
                <SelectValue placeholder="Filtrele" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-gray-200/60 dark:border-gray-700/60">
                <SelectItem value="all">🔍 Tümü</SelectItem>
                <SelectItem value="pending">⏳ Bekleyen</SelectItem>
                <SelectItem value="completed">✅ Tamamlanan</SelectItem>
              </SelectContent>
            </Select>

            {/* Show completed toggle */}
            <Button
              variant={showCompletedTasks ? "default" : "outline"}
              size="sm"
              onClick={toggleShowCompletedTasks}
              className={`h-9 px-4 rounded-lg transition-all duration-200 ${
                showCompletedTasks 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25' 
                  : 'border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700/80'
              }`}
            >
              {showCompletedTasks ? "✅ Gizle" : "👀 Göster"}
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Empty State */}
      {sortedTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Pin className="h-8 w-8 text-orange-600" />
          </div>
          
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {searchQuery || filterBy !== "all" 
                ? "Arama kriterlerine uygun sabitlenmiş görev bulunamadı" 
                : "Henüz sabitlenmiş görev yok"
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filterBy !== "all"
                ? "Farklı arama terimleri veya filtreler deneyebilirsin"
                : "Önemli görevleri sabitle ve onlara buradan hızlıca eriş"
              }
            </p>
            {!searchQuery && filterBy === "all" && (
              <Link href="/">
                <Button className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 text-white rounded-lg">
                  <FolderClosed className="h-4 w-4 mr-2" />
                  Projelere Git
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Grouped Tasks */}
      {Object.keys(groupedTasks).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([projectId, group]) => (
            <div key={projectId} className="space-y-3">
              {/* Compact Project Header */}
              <Link 
                href={`/projects/${projectId}`}
                className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-gray-200/50 dark:border-gray-700/30 hover:border-gray-300/70 dark:hover:border-gray-600/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {group.project.emoji ? (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                        <span className="text-lg">{group.project.emoji}</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm group-hover:shadow-md transition-shadow" />
                    )}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                      {group.tasks.length}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {group.project.name}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {group.tasks.length} sabitlenen görev
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-1" />
              </Link>

              {/* Tasks */}
              <HierarchicalTaskList
                tasks={group.tasks}
                onToggleComplete={toggleTaskComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onPin={toggleTaskPin}
                onEdit={handleEditTask}
                onAddSubTask={() => {
                  // Sub-task ekleme için proje sayfasına yönlendir - bu özellik sabitlenmiş görevlerde devre dışı
                }}
                onAddAttachment={(taskId, file) => {
                  uploadAttachment(taskId, file)
                }}
                onDeleteAttachment={(attachmentId) => {
                  deleteAttachment(attachmentId)
                }}
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
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <NewTaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          editingTask={editingTask}
        />
      )}
    </div>
  )
}