"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, MoreVertical, Eye, EyeOff, FolderKanban, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProjectStore } from "@/store/projectStore"
import { useTaskStore } from "@/store/taskStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CircularProgress } from "@/components/ui/circular-progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isProtectedProject, PROTECTED_PROJECT_MESSAGES } from "@/lib/project-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  emoji?: string
  notes?: string
  createdAt: string
  updatedAt: string
  _count: {
    tasks: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [showCompletedProjects, setShowCompletedProjects] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all")
  
  const { deleteProject, createProject, updateProject } = useProjectStore()
  const { 
    getProjectCompletionPercentage, 
    getPendingTasksCount, 
    getCompletedTasksCount,
    fetchTasks,
    tasks 
  } = useTaskStore()

  useEffect(() => {
    fetchProjectsData()
    fetchTasks()
  }, [])

  const fetchProjectsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Projeler yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Proje tamamlanma kontrolü
  const isProjectCompleted = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    
    // Korumalı projeler hiçbir zaman tamamlandı olarak işaretlenemez
    if (project && isProtectedProject(project.name)) return false
    
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    // Hiç görev yoksa tamamlandı sayılmaz
    if (projectTasks.length === 0) return false
    
    // En az 1 görev var ve tüm görevler tamamlanmışsa proje tamamlandı
    return projectTasks.every(task => task.completed)
  }

  // Filtrelenmiş projeler
  const filteredProjects = projects.filter(project => {
    // Arama filtresi
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.notes && project.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (!matchesSearch) return false
    
    // Durum filtresi
    const isCompleted = isProjectCompleted(project.id)
    
    if (statusFilter === "active" && isCompleted && !isProtectedProject(project.name)) {
      return false
    }
    
    if (statusFilter === "completed" && !isCompleted) {
      return false
    }
    
    // Tamamlanan projeler gösterme kontrolü
    if (!showCompletedProjects && isCompleted && !isProtectedProject(project.name)) {
      return false
    }
    
    return true
  })

  const handleCreateProject = async (name: string, emoji: string) => {
    try {
      const newProject = await createProject(name, emoji)
      await fetchProjectsData()
      toast.success('Proje başarıyla oluşturuldu')
      // Yeni projeye yönlendir
      router.push(`/projects/${newProject.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Proje oluşturulurken hata oluştu')
    }
  }

  const handleUpdateProject = async (name: string, emoji: string) => {
    if (!editingProject) return
    
    try {
      await updateProject(editingProject.id, name, emoji)
      await fetchProjectsData()
      setEditingProject(null)
      toast.success('Proje başarıyla güncellendi')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Proje güncellenirken hata oluştu')
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    
    // Korumalı proje kontrolü
    if (isProtectedProject(projectToDelete.name)) {
      toast.error(PROTECTED_PROJECT_MESSAGES.DELETE)
      return
    }
    
    try {
      await deleteProject(projectToDelete.id)
      await fetchProjectsData()
      setProjectToDelete(null)
      setIsDeleteDialogOpen(false)
      toast.success('Proje başarıyla silindi')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Proje silinirken hata oluştu')
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-8 bg-muted rounded animate-pulse" />
            <div className="w-24 h-8 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="rounded-lg border">
          <div className="h-12 border-b bg-muted/50 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header - Anasayfa stilinde */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <FolderKanban className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Projeler
              </h1>
              <p className="text-muted-foreground font-medium">
                Toplam {filteredProjects.length} proje
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button onClick={() => setIsProjectModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Proje
            </Button>
          </div>
        </div>

        {/* Arama ve Filtreler */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Proje ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Durum Filtresi */}
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "completed") => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Tamamlanan</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Tamamlananları Göster/Gizle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompletedProjects(!showCompletedProjects)}
                >
                  {showCompletedProjects ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showCompletedProjects ? "Tamamlanan projeleri gizle" : "Tamamlanan projeleri göster"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Projeler Tablosu */}
        {filteredProjects.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
            <div className="p-3 rounded-lg mx-auto mb-4 w-fit bg-primary/10">
              <FolderKanban className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {showCompletedProjects ? "Henüz proje yok" : "Aktif proje yok"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showCompletedProjects 
                ? "İlk projenizi oluşturarak başlayın" 
                : "Tüm projeler tamamlanmış. Yeni proje oluşturun veya tamamlanan projeleri gösterin"
              }
            </p>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Projeyi Oluştur
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            {/* Tablo Header */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-6">Proje</div>
              <div className="col-span-2 text-center">Görevler</div>
              <div className="col-span-2 text-center">İlerleme</div>
              <div className="col-span-1 text-center">Durum</div>
              <div className="col-span-1 text-center">İşlemler</div>
            </div>
            
            {/* Tablo Satırları */}
            <div className="divide-y">
              {filteredProjects.map((project) => {
                const pendingCount = getPendingTasksCount(project.id)
                const completedCount = getCompletedTasksCount(project.id)
                const totalTasks = pendingCount + completedCount
                const completionPercentage = getProjectCompletionPercentage(project.id)
                const isCompleted = isProjectCompleted(project.id)
                
                return (
                  <div
                    key={project.id}
                    className={cn(
                      "grid grid-cols-12 gap-2 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      isCompleted && "opacity-75"
                    )}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    {/* Proje Bilgisi */}
                    <div className="col-span-6 flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {project.emoji ? (
                          <span className="text-2xl">{project.emoji}</span>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FolderKanban className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        {project.notes && (
                          <p className="text-sm text-muted-foreground truncate">
                            {project.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Görev Sayısı */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-medium">{totalTasks}</div>
                        <div className="text-xs text-muted-foreground">
                          {completedCount}/{totalTasks}
                        </div>
                      </div>
                    </div>
                    
                    {/* İlerleme */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <CircularProgress 
                          percentage={completionPercentage} 
                          size={24} 
                          strokeWidth={3}
                        />
                        <span className="text-sm font-medium">
                          %{completionPercentage}
                        </span>
                      </div>
                    </div>
                    
                    {/* Durum */}
                    <div className="col-span-1 flex items-center justify-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        isCompleted 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : pendingCount > 0
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      )}>
                        {isCompleted ? "✓" : pendingCount > 0 ? "●" : "○"}
                      </span>
                    </div>
                    
                    {/* İşlemler */}
                    <div className="col-span-1 flex items-center justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setEditingProject(project)
                            setIsProjectModalOpen(true)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          {!isProtectedProject(project.name) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setProjectToDelete(project)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Proje Oluşturma/Düzenleme Modal'ı */}
        <NewProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false)
            setEditingProject(null)
          }}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
          editingProject={editingProject ? {
            id: editingProject.id,
            name: editingProject.name,
            emoji: editingProject.emoji || "",
          } : undefined}
        />

        {/* Silme Onay Dialog'u */}
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setProjectToDelete(null)
          }}
          onConfirm={handleDeleteProject}
          title="Projeyi Sil"
          message={`"${projectToDelete?.name}" projesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve projeye ait tüm görevler de silinecek.`}
          confirmText="Sil"
          cancelText="İptal"
          variant="destructive"
        />
      </div>
    </TooltipProvider>
  )
}