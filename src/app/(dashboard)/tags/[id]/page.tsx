"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PiTagSimpleFill } from "react-icons/pi"
import { ArrowLeft, Edit, Trash2, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTaskStore } from "@/store/taskStore"
import { useTagStore } from "@/store/tagStore"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { NewTagModal } from "@/components/modals/new-tag-modal"
import { TaskCard } from "@/components/task/task-card"
import { Switch } from "@/components/ui/switch"

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

  // TaskStore'dan tag görevlerini al - sadece üst seviye görevleri göster
  const tasks = getTasksByTag(tagId).filter(task => !task.parentTaskId)

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTagAndTasks()
  }, [tagId, fetchTasksByTag])

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
          {/* Tamamlanan görevleri göster toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Tamamlananlar</span>
            <Switch
              checked={showCompletedTasks}
              onCheckedChange={toggleShowCompletedTasks}
            />
          </div>
          
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

      {tasks.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <PiTagSimpleFill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Bu etiketle ilişkili görev yok</h3>
          <p className="text-muted-foreground">
            Henüz bu etiketle işaretlenmiş görev bulunmuyor
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={toggleTaskComplete}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onPin={toggleTaskPin}
              onAddSubTask={(parentTaskId) => {
                // Etiket sayfasında alt görev ekleme özelliği şu anda yok
                console.log('Alt görev ekleme:', parentTaskId)
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
          ))}
        </div>
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
              console.error("Failed to update tag:", error)
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