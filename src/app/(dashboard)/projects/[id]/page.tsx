"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useProjectStore } from "@/store/projectStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface Project {
  id: string
  name: string
  emoji?: string
  color: string
  userId: string
  createdAt: string
  updatedAt: string
  _count: {
    tasks: number
  }
}

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  projectId: string
  userId: string
  tagId: string | null
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { updateProject, deleteProject } = useProjectStore()

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        // Proje bilgilerini al
        const projectResponse = await fetch(`/api/projects/${projectId}`)
        if (!projectResponse.ok) {
          throw new Error('Proje bulunamadı')
        }
        const projectData = await projectResponse.json()
        setProject(projectData)

        // Proje ile ilişkili görevleri al
        const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`)
        if (!tasksResponse.ok) {
          throw new Error('Görevler yüklenemedi')
        }
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectAndTasks()
  }, [projectId])

  const handleUpdateProject = async (name: string, emoji: string, color: string) => {
    try {
      await updateProject(projectId, name, emoji, color)
      // Proje bilgilerini güncelle
      setProject(prev => prev ? { ...prev, name, emoji, color } : null)
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  const handleDeleteProject = async () => {
    await deleteProject(projectId)
    router.push("/") // Ana sayfaya yönlendir
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Proje Bulunamadı</h1>
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
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: project.color + '20' }}>
            {project.emoji ? (
              <span className="text-2xl">{project.emoji}</span>
            ) : (
              <div 
                className="w-8 h-8 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              {project._count.tasks} görev
            </p>
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

      {tasks.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="p-3 rounded-lg mx-auto mb-4 w-fit" style={{ backgroundColor: project.color + '20' }}>
            {project.emoji ? (
              <span className="text-3xl">{project.emoji}</span>
            ) : (
              <div 
                className="w-12 h-12 rounded-full" 
                style={{ backgroundColor: project.color }}
              />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">Bu projede henüz görev yok</h3>
          <p className="text-muted-foreground mb-4">
            İlk görevini oluşturarak başlayabilirsin
          </p>
          <Button>
            Görev Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Görevler ({tasks.length})
            </h2>
            <Button>
              Yeni Görev
            </Button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : task.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      }`}
                    >
                      {task.priority === "HIGH" ? "Yüksek" : task.priority === "MEDIUM" ? "Orta" : "Düşük"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.completed
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {task.completed ? "Tamamlandı" : "Devam Ediyor"}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Oluşturulma: {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Düzenleme Modal'ı */}
      {project && (
        <NewProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateProject}
          editingProject={{
            id: project.id,
            name: project.name,
            emoji: project.emoji || "",
            color: project.color
          }}
        />
      )}

      {/* Silme Onay Dialog'u */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title="Projeyi Sil"
        message={`"${project?.name}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve projeye ait tüm görevler de silinecek.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  )
}