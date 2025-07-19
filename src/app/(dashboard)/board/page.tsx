"use client"

import { useEffect, useState } from "react"
import { Pin, Search, FolderClosed, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskCard } from "@/components/task/task-card"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import Link from "next/link"
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

  // İstatistikler
  const totalPinned = pinnedTasks.length
  const completedPinned = pinnedTasks.filter(task => task.completed).length
  const pendingPinned = totalPinned - completedPinned

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <Pin className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sabitlenmiş Görevler</h1>
            <p className="text-muted-foreground">
              Tüm projelerden sabitlenmiş görevlerin listesi
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalPinned}</div>
            <div className="text-xs text-muted-foreground">Toplam</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedPinned}</div>
            <div className="text-xs text-muted-foreground">Tamamlanan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pendingPinned}</div>
            <div className="text-xs text-muted-foreground">Bekleyen</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Görevlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value: "date" | "priority" | "project") => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sıralama" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">📅 Tarihe göre</SelectItem>
            <SelectItem value="priority">🔥 Önceliğe göre</SelectItem>
            <SelectItem value="project">📁 Projeye göre</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter */}
        <Select value={filterBy} onValueChange={(value: "all" | "pending" | "completed") => setFilterBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
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
        >
          {showCompletedTasks ? "✅ Tamamlananları Gizle" : "👀 Tamamlananları Göster"}
        </Button>
      </div>

      {/* Empty State */}
      {sortedTasks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="p-3 rounded-lg mx-auto mb-4 w-fit bg-orange-100 dark:bg-orange-900/20">
            <Pin className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || filterBy !== "all" 
              ? "Arama kriterlerine uygun sabitlenmiş görev bulunamadı" 
              : "Henüz sabitlenmiş görev yok"
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterBy !== "all"
              ? "Farklı arama terimleri veya filtreler deneyebilirsin"
              : "Önemli görevleri sabitle ve onlara buradan hızlıca eriş"
            }
          </p>
          {!searchQuery && filterBy === "all" && (
            <Link href="/">
              <Button>
                <FolderClosed className="h-4 w-4 mr-2" />
                Projelere Git
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Grouped Tasks */}
      {Object.keys(groupedTasks).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([projectId, group]) => (
            <div key={projectId} className="space-y-3">
              {/* Project Header */}
              <div className="flex items-center justify-between">
                <Link 
                  href={`/projects/${projectId}`}
                  className="flex items-center space-x-3 group hover:bg-accent/50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {group.project.emoji ? (
                      <span className="text-xl">{group.project.emoji}</span>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary" />
                    )}
                    <h2 className="text-lg font-semibold">{group.project.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({group.tasks.length} sabitlenen görev)
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </div>

              {/* Tasks */}
              <div className="grid gap-3">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={toggleTaskComplete}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onPin={toggleTaskPin}
                    onAddSubTask={() => {
                      // Sub-task ekleme için proje sayfasına yönlendir
                      window.location.href = `/projects/${projectId}#task-${task.id}`
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
                    className="bg-orange-50/50 dark:bg-orange-900/5 border-l-4 border-l-orange-500"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}