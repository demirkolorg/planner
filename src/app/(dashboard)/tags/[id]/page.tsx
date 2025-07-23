"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PiTagSimpleFill } from "react-icons/pi"
import { ArrowLeft, Edit, Trash2, Clock, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useTaskStore } from "@/store/taskStore"
import { useTagStore } from "@/store/tagStore"
import { useProjectStore } from "@/store/projectStore"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { NewTagModal } from "@/components/modals/new-tag-modal"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"

interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
  _count: {
    tasks: number
  }
}


export default function TagDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tagId = params.id as string
  const [tag, setTag] = useState<Tag | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority" | "project">("date")
  const [filterBy, setFilterBy] = useState<"all" | "pending" | "completed">("all")
  const { 
    fetchTasksByTag, 
    getTasksByTag,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    toggleTaskPin,
    updateTaskTags,
    updateTaskReminders,
    showCompletedTasks,
    toggleShowCompletedTasks,
    getCompletedTasksCountByTag,
    getPendingTasksCountByTag
  } = useTaskStore()
  const { updateTag, deleteTag } = useTagStore()
  const { projects, fetchProjects } = useProjectStore()

  // TaskStore'dan tag görevlerini al - tüm görevleri hierarchical sırayla göster
  const allTasks = getTasksByTag(tagId)

  // Arama ve filtreleme
  const filteredTasks = allTasks.filter(task => {
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
  const tasks = [...filteredTasks].sort((a, b) => {
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

  useEffect(() => {
    const fetchTagAndTasks = async () => {
      try {
        // Tag bilgilerini al
        const tagResponse = await fetch(`/api/tags/${tagId}`)
        if (!tagResponse.ok) {
          throw new Error('Tag bulunamadı')
        }
        const tagData = await tagResponse.json()
        setTag(tagData)

        // TaskStore'dan görevleri al
        await fetchTasksByTag(tagId)
        
        // Projeleri yükle (sıralama için gerekli)
        await fetchProjects()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTagAndTasks()
  }, [tagId, fetchTasksByTag, fetchProjects])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !tag) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tags">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Etiket Bulunamadı</h1>
        </div>
        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tags">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: tag.color + '20' }}>
            <PiTagSimpleFill
              className="w-8 h-8"
              style={{ color: tag.color }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{tag.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                <span>{getCompletedTasksCountByTag(tagId)} tamamlandı</span>
              </span>
              <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                <span>{getPendingTasksCountByTag(tagId)} bekleyen</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-600 hover:text-red-700"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
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
              className="pl-10 h-9 rounded-lg border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200"
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
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md shadow-purple-500/25' 
                  : 'border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700/80'
              }`}
            >
              {showCompletedTasks ? "✅ Gizle" : "👀 Göster"}
            </Button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
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
          tasks={tasks}
          onToggleComplete={toggleTaskComplete}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onPin={toggleTaskPin}
          onAddSubTask={(parentTaskId) => {
            // Etiket sayfasında alt görev ekleme özelliği şu anda yok
          }}
          onUpdateTags={async (taskId, tagIds) => {
            try {
              await updateTaskTags(taskId, tagIds)
            } catch (error) {
            }
          }}
          onUpdatePriority={async (taskId, priority) => {
            try {
              await updateTask(taskId, { priority })
            } catch (error) {
            }
          }}
          onUpdateReminders={async (taskId, reminders) => {
            try {
              await updateTaskReminders(taskId, reminders)
            } catch (error) {
            }
          }}
          showTreeConnectors={true}
        />
      )}
      {/* Düzenleme Modal'ı */}
      {tag && (
        <NewTagModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (name, color) => {
            try {
              await updateTag(tagId, name, color)
              // Tag bilgilerini güncelle
              setTag(prev => prev ? { ...prev, name, color } : null)
            } catch (error) {
            }
          }}
          editingTag={{
            id: tag.id,
            name: tag.name,
            color: tag.color
          }}
        />
      )}

      {/* Silme Onay Dialog'u */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          await deleteTag(tagId)
          router.push("/tags") // Etiketler sayfasına yönlendir
        }}
        title="Etiketi Sil"
        message={`"${tag?.name}" etiketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve etiket tüm görevlerden kaldırılacak.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  )
}