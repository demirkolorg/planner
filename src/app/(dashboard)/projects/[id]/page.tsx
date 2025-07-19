"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, MoreVertical, Plus, Settings, Clock, FolderClosed, Check, Archive, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useProjectStore } from "@/store/projectStore"
import { useTaskStore } from "@/store/taskStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { NewSectionModal } from "@/components/modals/new-section-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type { Project as ProjectType, Section as SectionType } from "@/types/task"

interface Project extends Omit<ProjectType, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
  _count: {
    tasks: number
  }
}



export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const { updateProject, deleteProject, fetchSections, getSectionsByProject, createSection } = useProjectStore()
  const { fetchTasksByProject, createTask, getTasksByProject, getTasksBySection } = useTaskStore()

  const fetchProjectData = async () => {
    try {
      // Proje bilgilerini al
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error('Proje bulunamadı')
      }
      const projectData = await projectResponse.json()
      setProject(projectData)

      // ProjectStore'dan section'ları al
      await fetchSections(projectId)

      // TaskStore'dan görevleri al
      await fetchTasksByProject(projectId)

      setIsLoading(false)
    } catch (error) {
      console.error('Proje verileri alınırken hata oluştu:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata')
      setIsLoading(false)
    }
  }

  // TaskStore'dan proje görevlerini al
  const tasks = getTasksByProject(projectId)
  // ProjectStore'dan proje section'larını al
  const sections = getSectionsByProject(projectId)

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const handleUpdateProject = async (name: string, emoji: string) => {
    try {
      await updateProject(projectId, name, emoji)
      // Proje bilgilerini güncelle
      setProject(prev => prev ? { ...prev, name, emoji } : null)
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  const handleDeleteProject = async () => {
    await deleteProject(projectId)
    router.push("/") // Ana sayfaya yönlendir
  }

  const handleCreateSection = async (name: string) => {
    try {
      await createSection(projectId, name)
    } catch (error) {
      console.error("Failed to create section:", error)
    }
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
          <div className="p-3 rounded-lg bg-primary/10">
            {project.emoji ? (
              <span className="text-2xl">{project.emoji}</span>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary" />
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
            onClick={() => setIsSectionModalOpen(true)}
          >
            Bölüm Ekle
          </Button>
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

      {/* Proje Notları */}
      {project.notes && (
        <div className="bg-card border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Proje Notları</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}


      {/* Bölümler ve Görevler */}
      {sections.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="p-3 rounded-lg mx-auto mb-4 w-fit bg-primary/10">
            {project.emoji ? (
              <span className="text-3xl">{project.emoji}</span>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">Bu projede henüz bölüm yok</h3>
          <p className="text-muted-foreground mb-4">
            İlk bölümünü oluşturarak başlayabilirsin
          </p>
          <Button onClick={() => setIsSectionModalOpen(true)}>
            Bölüm Ekle
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
          {sections.map((section) => {
            const sectionTasks = getTasksBySection(section.id)
            
            return (
              <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <h3 className="text-lg font-semibold">{section.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({sectionTasks.length} görev)
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                          className="p-2 border rounded-md hover:bg-accent cursor-pointer inline-flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setIsTaskModalOpen(true)
                        }}>
                          <Plus className="h-4 w-4" />
                          Görev Ekle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Settings className="h-4 w-4" />
                          Bölümü Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Clock className="h-4 w-4" />
                          Bölümü Taşı
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <FolderClosed className="h-4 w-4" />
                          Bölüm Sıralamasını Yönet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <FolderClosed className="h-4 w-4" />
                          Çoğalt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Check className="h-4 w-4" />
                          Tamamlanan Görevleri Göster
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Archive className="h-4 w-4" />
                          Arşivle
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={(e) => e.stopPropagation()}>
                          <Trash className="h-4 w-4" />
                          Bölümü Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  {sectionTasks.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-muted-foreground mb-2">Bu bölümde henüz görev yok</p>
                      <Button variant="outline" size="sm">
                        İlk Görevi Ekle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sectionTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{task.title}</h4>
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
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
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

      {/* Bölüm Ekleme Modal'ı */}
      <NewSectionModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        onSave={handleCreateSection}
      />

      {/* Görev Ekleme Modal'ı */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={async (newTask) => {
          if (!newTask) {
            // Fallback: Tüm verileri yenile
            await fetchProjectData()
          }
          // TaskStore otomatik olarak tüm UI'ı güncelleyecek
        }}
      />
    </div>
  )
}