"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Edit, Trash2, MoreVertical, Plus, Settings, Clock,TriangleAlert, FolderClosed, Check, Archive, Trash, ChevronDown, ChevronRight, ArrowUpDown, Calendar, CalendarClock, Zap, Hash, SortAsc, SortDesc, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useProjectStore } from "@/store/projectStore"
import { useTaskStore } from "@/store/taskStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { NewSectionModal } from "@/components/modals/new-section-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveSectionModal } from "@/components/modals/move-section-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskCommentsModal } from "@/components/modals/task-comments-modal"
import { ProjectSkeleton } from "@/components/ui/skeleton"
import { ProjectTimelineModal } from "@/components/modals/project-timeline-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { TaskCard } from "@/components/task/task-card"

import type { Project as ProjectType, Section as SectionType } from "@/types/task"

type SortOption = 
  | 'due-date-asc'      // Bitiş Tarihi - Yaklaşanlar Önce
  | 'due-date-desc'     // Bitiş Tarihi - Uzak Olanlar Önce  
  | 'created-desc'      // Oluşturma Tarihi - En Yeni Önce
  | 'created-asc'       // Oluşturma Tarihi - En Eski Önce
  | 'priority-desc'     // Öncelik - Yüksekten Düşüğe
  | 'priority-asc'      // Öncelik - Düşükten Yükseğe
  | 'title-asc'         // Alfabetik - A'dan Z'ye
  | 'title-desc'        // Alfabetik - Z'den A'ya

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Oluşturma Tarihi - En Yeni Önce', icon: CalendarDays },
  { value: 'created-asc', label: 'Oluşturma Tarihi - En Eski Önce', icon: CalendarDays },
  { value: 'due-date-asc', label: 'Bitiş Tarihi - Yaklaşanlar Önce', icon: Calendar },
  { value: 'due-date-desc', label: 'Bitiş Tarihi - Uzak Olanlar Önce', icon: Calendar },
  { value: 'priority-desc', label: 'Öncelik - Yüksekten Düşüğe', icon: Zap },
  { value: 'priority-asc', label: 'Öncelik - Düşükten Yükseğe', icon: Zap },
  { value: 'title-asc', label: 'Alfabetik - A\'dan Z\'ye', icon: SortAsc },
  { value: 'title-desc', label: 'Alfabetik - Z\'den A\'ya', icon: SortDesc },
] as const

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
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const [expandTaskId, setExpandTaskId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalContext, setTaskModalContext] = useState<{
    project?: { id: string; name: string; emoji?: string }
    section?: { id: string; name: string; projectId: string }
    parentTaskId?: string
    parentTaskTitle?: string
  }>({})
  const [openSections, setOpenSections] = useState<string[]>([])
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState("")
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState("")
  const [isSectionDeleteDialogOpen, setIsSectionDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<SectionType | null>(null)
  const [isSectionMoveModalOpen, setIsSectionMoveModalOpen] = useState(false)
  const [sectionToMove, setSectionToMove] = useState<SectionType | null>(null)
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; subTaskCount: number } | null>(null)
  const [isTaskMoveModalOpen, setIsTaskMoveModalOpen] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('created-desc')
  const [taskToMove, setTaskToMove] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isTaskCloneModalOpen, setIsTaskCloneModalOpen] = useState(false)
  const [taskToClone, setTaskToClone] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [commentsModalTask, setCommentsModalTask] = useState<{ id: string; title: string; completed: boolean } | null>(null)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
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
    setIsTaskModalOpen(true)
  }, [])
  const { projects, updateProject, deleteProject, fetchSections, getSectionsByProject, createSection, updateSection, deleteSection, moveSection } = useProjectStore()
  const { 
    fetchTasksByProject, 
    createTask, 
    getTasksByProject, 
    getTasksBySection,
    getTasksWithoutSection,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    cloneTask,
    moveTask,
    toggleTaskPin,
    addSubTask,
    updateTaskTags,
    updateTaskReminders,
    showCompletedTasks,
    toggleShowCompletedTasks,
    getCompletedTasksCount,
    getPendingTasksCount,
    getOverdueTasksByProject,
    getOverdueTasksCountByProject,
    refreshTaskCommentCount
  } = useTaskStore()

  const fetchProjectData = useCallback(async () => {
    try {
      // Store'da proje varsa header için hemen yükle
      const existingProject = projects.find(p => p.id === projectId)
      if (existingProject) {
        setProject(existingProject)
      }

      // Store'da bu projenin sections/tasks'ı var mı kontrol et
      const { sections: allSections = [] } = useProjectStore.getState()
      const { tasks: allTasks = [] } = useTaskStore.getState()
      
      const hasProjectSections = allSections.some(s => s.projectId === projectId)
      const hasProjectTasks = allTasks.some(t => t.projectId === projectId)
      const hasExistingData = existingProject && (hasProjectSections || hasProjectTasks)

      // Sadece cache'de veri yoksa loading göster
      if (!hasExistingData) {
        setIsLoading(true)
      }
      
      // Tüm API çağrılarını paralel yap (arka planda güncelleme için)
      const [projectResponse, sectionsResult, tasksResult] = await Promise.allSettled([
        fetch(`/api/projects/${projectId}`),
        fetchSections(projectId),
        fetchTasksByProject(projectId)
      ])

      // Proje bilgisini işle
      if (projectResponse.status === 'fulfilled' && projectResponse.value.ok) {
        const projectData = await projectResponse.value.json()
        setProject(projectData)
      } else if (!existingProject) {
        throw new Error('Proje bulunamadı')
      }

      // Hatalar varsa log'la ama sayfayı durdurma
      if (sectionsResult.status === 'rejected') {
        console.warn('Sections yüklenemedi:', sectionsResult.reason)
      }
      if (tasksResult.status === 'rejected') {
        console.warn('Tasks yüklenemedi:', tasksResult.reason)
      }

      // Loading'i kapat
      setIsLoading(false)
    } catch (error) {
      console.error('Proje verileri alınırken hata oluştu:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen hata')
      setIsLoading(false)
    }
  }, [projectId, fetchSections, fetchTasksByProject, projects])

  // Sıralama fonksiyonu
  const sortTasks = useCallback((tasks: any[], sortOption: SortOption) => {
    const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'NONE': 0 }
    
    return [...tasks].sort((a, b) => {
      switch (sortOption) {
        case 'due-date-asc':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          
        case 'due-date-desc':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
          
        case 'created-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          
        case 'created-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          
        case 'priority-desc':
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          
        case 'priority-asc':
          return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
          
        case 'title-asc':
          return a.title.localeCompare(b.title, 'tr')
          
        case 'title-desc':
          return b.title.localeCompare(a.title, 'tr')
          
        default:
          return 0
      }
    })
  }, [])

  // TaskStore'dan proje görevlerini al
  const allTasks = getTasksByProject(projectId)
  // ProjectStore'dan proje section'larını al
  const sections = getSectionsByProject(projectId)
  
  // Sıralanmış görevleri al
  const tasks = useMemo(() => sortTasks(allTasks, sortOption), [allTasks, sortOption, sortTasks])
  
  // Bölüm görevlerini sıralı al
  const getSortedTasksBySection = useCallback((sectionId: string) => {
    const sectionTasks = getTasksBySection(sectionId)
    return sortTasks(sectionTasks, sortOption)
  }, [getTasksBySection, sortTasks, sortOption])
  
  // Bölümsüz görevleri sıralı al
  const getSortedTasksWithoutSection = useCallback(() => {
    const tasksWithoutSection = getTasksWithoutSection(projectId)
    return sortTasks(tasksWithoutSection, sortOption)
  }, [getTasksWithoutSection, projectId, sortTasks, sortOption])

  useEffect(() => {
    // İlk yükleme sırasında cache kontrolü yap
    const existingProject = projects.find(p => p.id === projectId)
    
    // Proje store'da varsa hemen set et
    if (existingProject) {
      setProject(existingProject)
      
      // Bu projenin sections/tasks'ları daha önce yüklenmiş mi kontrol et
      const { sections: allSections = [] } = useProjectStore.getState()
      const { tasks: allTasks = [] } = useTaskStore.getState()
      
      const hasProjectSections = allSections.some(s => s.projectId === projectId)
      const hasProjectTasks = allTasks.some(t => t.projectId === projectId)
      
      // En azından sections veya tasks yüklenmişse loading'i kapat
      if (hasProjectSections || hasProjectTasks) {
        setIsLoading(false)
      }
    }
    
    fetchProjectData()
  }, [projectId])

  // Expand task effect - görevler yüklendikten sonra çalışsın
  useEffect(() => {
    const highlightParam = searchParams.get('highlight')
    
    // Görevler yüklenmiş ve highlight parametresi varsa
    if (highlightParam && !isLoading) {
      // Kısa bir gecikme ile expand'i aktif et (DOM'un render olması için)
      const expandTimer = setTimeout(() => {
        setExpandTaskId(highlightParam)
        
        // URL'den highlight parametresini temizle
        const url = new URL(window.location.href)
        url.searchParams.delete('highlight')
        router.replace(url.pathname + url.search)
      }, 200) // 200ms gecikme - expand animasyonu için biraz daha uzun
      
      return () => clearTimeout(expandTimer)
    }
  }, [searchParams, router, isLoading])

  // Section ID'lerini memoize et
  const sectionIds = useMemo(() => sections.map(s => s.id), [sections])
  
  // Sections yüklendiğinde tümünü otomatik aç (sadece bir kez)
  useEffect(() => {
    if (sectionIds.length > 0 && openSections.length === 0) {
      const sectionsToOpen = [...sectionIds]
      // Süresi geçmiş görevler varsa onu da aç
      if (getOverdueTasksCountByProject(projectId) > 0) {
        sectionsToOpen.push('overdue-tasks')
      }
      // Bölümsüz görevler varsa onu da aç
      const sortedTasksWithoutSection = getSortedTasksWithoutSection()
      if (sortedTasksWithoutSection.length > 0) {
        sectionsToOpen.push('tasks-without-section')
      }
      setOpenSections(sectionsToOpen)
    }
  }, [sectionIds.length, getOverdueTasksCountByProject, projectId, getSortedTasksWithoutSection]) // openSections.length kaldırıldı - infinite loop prevention

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

  const handleUpdateSection = async (sectionId: string, name: string) => {
    try {
      await updateSection(sectionId, name)
      setEditingSectionId(null)
      setEditingSectionName("")
    } catch (error) {
      console.error("Failed to update section:", error)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await deleteSection(sectionId)
      setIsSectionDeleteDialogOpen(false)
      setSectionToDelete(null)
    } catch (error) {
      console.error("Failed to delete section:", error)
    }
  }

  const handleMoveSection = async (targetProjectId: string) => {
    if (!sectionToMove) return
    
    try {
      await moveSection(sectionToMove.id, targetProjectId)
      setIsSectionMoveModalOpen(false)
      setSectionToMove(null)
      // Refresh current project sections
      await fetchSections(projectId)
      // Refresh tasks as well since they moved with the section
      await fetchTasksByProject(projectId)
    } catch (error) {
      console.error("Failed to move section:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setIsTaskDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleMoveTask = async (targetProjectId: string, targetSectionId: string | null) => {
    if (!taskToMove) return
    
    try {
      await moveTask(taskToMove.id, targetProjectId, targetSectionId)
      setIsTaskMoveModalOpen(false)
      setTaskToMove(null)
    } catch (error) {
      console.error("Failed to move task:", error)
    }
  }

  const handleCloneTask = async (targetProjectId: string, targetSectionId: string | null) => {
    if (!taskToClone) return
    
    try {
      await cloneTask(taskToClone.id, targetProjectId, targetSectionId)
      setIsTaskCloneModalOpen(false)
      setTaskToClone(null)
    } catch (error) {
      console.error("Failed to clone task:", error)
    }
  }

  const handleCommentTask = (taskId: string, taskTitle: string) => {
    // Görevin tamamlanma durumunu bul
    const task = tasks.find(t => t.id === taskId)
    setCommentsModalTask({ id: taskId, title: taskTitle, completed: task?.completed || false })
    setIsCommentsModalOpen(true)
  }

  // Debounce hook
  const useDebounce = (callback: (...args: unknown[]) => void, delay: number) => {
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    const debouncedCallback = useCallback((...args: unknown[]) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      const newTimer = setTimeout(() => {
        callback(...args)
      }, delay)
      setDebounceTimer(newTimer)
    }, [callback, delay, debounceTimer])

    return debouncedCallback
  }

  const updateNotes = async (notes: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project?.name,
          emoji: project?.emoji,
          notes: notes.trim() || null
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update notes')
      }
      
      const updatedProject = await response.json()
      setProject(updatedProject)
    } catch (error) {
      console.error("Failed to update notes:", error)
    }
  }

  const debouncedUpdateNotes = useDebounce(updateNotes, 1000) // 1 saniye debounce

  const handleNotesChange = (value: string) => {
    setNotesValue(value)
    debouncedUpdateNotes(value)
  }

  const handleStartEditingNotes = () => {
    setNotesValue(project?.notes || "")
    setIsEditingNotes(true)
  }

  const handleBlurNotes = () => {
    setIsEditingNotes(false)
  }

  // Header için hemen yükle, sadece project bulunamazsa hata göster
  if (error || (!project && !isLoading)) {
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
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error || 'Proje yüklenemedi'}</p>
        </div>
      </div>
    )
  }


  return (
    <TooltipProvider>
      <div className="space-y-4">
      {/* Compact Project Header */}
      <div className="flex items-center justify-between">
        {/* Left: Navigation & Project Info */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {project?.emoji ? (
                <span className="text-xl">{project.emoji}</span>
              ) : project ? (
                <div className="w-6 h-6 rounded-full bg-primary" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {project?.name || (
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                )}
              </h1>
              {project && (
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{getCompletedTasksCount(projectId)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tamamlanan görevler</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1">  
                        <Clock className="h-3 w-3 text-primary" />
                        <span>{getPendingTasksCount(projectId)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bekleyen görevler</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  {getOverdueTasksCountByProject(projectId) > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1">
                          <TriangleAlert className="h-3 w-3 text-destructive" />
                          <span className="text-destructive font-medium">{getOverdueTasksCountByProject(projectId)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Süresi geçmiş görevler</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${((getCompletedTasksCount(projectId) / (getCompletedTasksCount(projectId) + getPendingTasksCount(projectId))) || 0) * 100}%` 
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tamamlanma oranı</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs font-medium">
                        {Math.round(((getCompletedTasksCount(projectId) / (getCompletedTasksCount(projectId) + getPendingTasksCount(projectId))) || 0) * 100)}%
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tamamlanma yüzdesi</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        {project && (
          <div className="flex items-center space-x-3">
            {/* Tamamlananları Göster/Gizle Switch */}
            <div className="flex items-center space-x-2">
              <label htmlFor="show-completed" className="text-sm text-muted-foreground">
                Tamamlananlar
              </label>
              <Switch
                id="show-completed"
                checked={showCompletedTasks}
                onCheckedChange={toggleShowCompletedTasks}
              />
            </div>
            
            {/* Sıralama Dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sıralama Seçenekleri</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-80">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSortOption(option.value as SortOption)}
                    className={sortOption === option.value ? "bg-accent" : ""}
                  >
                    <option.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="flex-1">{option.label}</span>
                    {sortOption === option.value && (
                      <Check className="h-4 w-4 ml-2 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsTimelineModalOpen(true)}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Proje Zaman Çizelgesi</p>
              </TooltipContent>
            </Tooltip>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSectionModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Bölüm
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // İlk bölümü default section olarak seç
                const firstSection = sections.length > 0 ? sections[0] : undefined
                setTaskModalContext({
                  project: { id: project.id, name: project.name, emoji: project.emoji },
                  section: firstSection ? { id: firstSection.id, name: firstSection.name, projectId: project.id } : undefined
                })
                setIsTaskModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Görev
            </Button>
            
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Proje Ayarları</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Projeyi Düzenle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Projeyi Sil
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Proje Notları */}
      {project && (
        isEditingNotes ? (
          <Input
            value={notesValue}
            onChange={(e) => handleNotesChange(e.target.value)}
            onBlur={handleBlurNotes}
            placeholder="Projeyle ilgili not girin..."
            className="text-sm"
            autoFocus
          />
        ) : (
          <div 
            className="min-h-[32px] cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
            onClick={handleStartEditingNotes}
          >
            {project.notes ? (
              <p className="flex-1">{project.notes}</p>
            ) : (
              <p className="italic flex-1">Projeyle ilgili not girin...</p>
            )}
          </div>
        )
      )}

      {/* Bölümler ve Görevler */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-28 bg-muted rounded-lg animate-pulse" />
        </div>
      ) : sections.length === 0 && getOverdueTasksByProject(projectId).length === 0 && getSortedTasksWithoutSection().length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
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
        <Accordion type="multiple" className="w-full space-y-2 overflow-visible" value={openSections} onValueChange={setOpenSections}>
          {/* Süresi Geçmiş Görevler Accordion */}
          {getOverdueTasksByProject(projectId).length > 0 && (
            <AccordionItem key="overdue-tasks" value="overdue-tasks" className="border-none overflow-visible">
              <AccordionTrigger className="px-4 py-2 hover:bg-destructive/10 rounded-lg border-b border-destructive/20 mb-1 transition-colors hover:no-underline w-full bg-destructive/10">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 flex-1">
                    <ChevronDown className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-medium text-destructive">Süresi Geçmiş Görevler</h3>
                    <span className="text-xs text-destructive">
                      {getOverdueTasksByProject(projectId).length}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-1 pb-3 overflow-visible">
                <HierarchicalTaskList
                  tasks={getOverdueTasksByProject(projectId)}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={(taskId) => {
                    const taskToDelete = getOverdueTasksByProject(projectId).find(t => t.id === taskId)
                    if (taskToDelete) {
                      const subTaskCount = taskToDelete.subTasks?.length || 0
                      setTaskToDelete({ 
                        id: taskId, 
                        title: taskToDelete.title,
                        subTaskCount: subTaskCount
                      })
                      setIsTaskDeleteDialogOpen(true)
                    }
                  }}
                  onPin={toggleTaskPin}
                  onAddSubTask={(parentTaskId) => {
                    const parentTask = getOverdueTasksByProject(projectId).find(t => t.id === parentTaskId)
                    const section = sections.find(s => s.id === parentTask?.sectionId)
                    setTaskModalContext({
                      project: { id: project.id, name: project.name, emoji: project.emoji },
                      section: section ? { id: section.id, name: section.name, projectId: project.id } : undefined,
                      parentTaskId: parentTaskId,
                      parentTaskTitle: parentTask?.title
                    })
                    setIsTaskModalOpen(true)
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
                  onComment={handleCommentTask}
                  showTreeConnectors={true}
                  enableDragAndDrop={false}
                  onMoveTask={async (taskId, newParentId) => {
                    try {
                      await updateTask(taskId, { parentTaskId: newParentId })
                    } catch (error) {
                      console.error('Failed to move task:', error)
                    }
                  }}
                  expandTaskId={null} // Gecikmiş bölümünde expand etme
                />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Bölümsüz Görevler Accordion */}
          {getSortedTasksWithoutSection().length > 0 && (
            <AccordionItem key="tasks-without-section" value="tasks-without-section" className="border-none overflow-visible">
              <AccordionTrigger className="px-4 py-2 hover:bg-secondary/10 rounded-lg border-b border-secondary/20 mb-1 transition-colors hover:no-underline w-full bg-secondary/10">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 flex-1">
                    <ChevronDown className="h-4 w-4 text-secondary" />
                    <h3 className="text-sm font-medium text-secondary-foreground">Bölümsüz Görevler</h3>
                    <span className="text-xs text-secondary">
                      {getSortedTasksWithoutSection().length}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-1 pb-3 overflow-visible">
                <HierarchicalTaskList
                  tasks={getSortedTasksWithoutSection()}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={(taskId) => {
                    const taskToDelete = getSortedTasksWithoutSection().find(t => t.id === taskId)
                    if (taskToDelete) {
                      const subTaskCount = taskToDelete.subTasks?.length || 0
                      setTaskToDelete({ 
                        id: taskId, 
                        title: taskToDelete.title,
                        subTaskCount: subTaskCount
                      })
                      setIsTaskDeleteDialogOpen(true)
                    }
                  }}
                  onPin={toggleTaskPin}
                  onEdit={handleEditTask}
                  onCopy={(taskId) => {
                    const taskToClone = getSortedTasksWithoutSection().find(t => t.id === taskId)
                    if (taskToClone) {
                      setTaskToClone({
                        id: taskId,
                        title: taskToClone.title,
                        projectId: taskToClone.projectId,
                        sectionId: taskToClone.sectionId || undefined
                      })
                      setIsTaskCloneModalOpen(true)
                    }
                  }}
                  onMove={(taskId) => {
                    const taskToMove = getSortedTasksWithoutSection().find(t => t.id === taskId)
                    if (taskToMove) {
                      setTaskToMove({
                        id: taskId,
                        title: taskToMove.title,
                        projectId: taskToMove.projectId,
                        sectionId: taskToMove.sectionId || undefined
                      })
                      setIsTaskMoveModalOpen(true)
                    }
                  }}
                  onAddSubTask={(parentTaskId) => {
                    const parentTask = getSortedTasksWithoutSection().find(t => t.id === parentTaskId)
                    setTaskModalContext({
                      project: { id: project.id, name: project.name, emoji: project.emoji },
                      section: undefined, // Bölümsüz görevler için section undefined
                      parentTaskId: parentTaskId,
                      parentTaskTitle: parentTask?.title
                    })
                    setIsTaskModalOpen(true)
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
                  onComment={handleCommentTask}
                  showTreeConnectors={true}
                  enableDragAndDrop={false}
                  onMoveTask={async (taskId, newParentId) => {
                    try {
                      await updateTask(taskId, { parentTaskId: newParentId })
                    } catch (error) {
                      console.error('Failed to move task:', error)
                    }
                  }}
                  expandTaskId={null} // Bölümsüz görevlerde expand etme
                />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {sections.map((section) => {
            const sectionTasks = getSortedTasksBySection(section.id)
            const isOpen = openSections.includes(section.id)
            
            return (
              <AccordionItem key={section.id} value={section.id} className="border-none overflow-visible">
                <AccordionTrigger className="px-4 py-2 hover:bg-accent/50 rounded-lg border-b-1 mb-2 transition-colors hover:no-underline w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3 flex-1">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium">{section.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {sectionTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-2 h-7 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTaskModalContext({
                            project: { id: project.id, name: project.name, emoji: project.emoji },
                            section: { id: section.id, name: section.name, projectId: project.id }
                          })
                          setIsTaskModalOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Görev
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div 
                            className="p-1 hover:bg-accent rounded cursor-pointer inline-flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setEditingSectionId(section.id)
                            setEditingSectionName(section.name)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Bölümü Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            setSectionToMove(section)
                            setIsSectionMoveModalOpen(true)
                          }}>
                            <div className="h-4 w-4 mr-2 flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="5 9 2 12 5 15"></polyline>
                                <polyline points="9 5 12 2 15 5"></polyline>
                                <polyline points="15 19 12 22 9 19"></polyline>
                                <polyline points="19 9 22 12 19 15"></polyline>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="12" y1="2" x2="12" y2="22"></line>
                              </svg>
                            </div>
                            Bölümü Taşı
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSectionToDelete(section)
                              setIsSectionDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Bölümü Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3 overflow-visible">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-16 bg-muted rounded-lg animate-pulse" />
                      <div className="h-16 bg-muted rounded-lg animate-pulse" />
                    </div>
                  ) : sectionTasks.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground mb-2">Bu bölümde henüz görev yok</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setTaskModalContext({
                            project: { id: project.id, name: project.name, emoji: project.emoji },
                            section: { id: section.id, name: section.name, projectId: project.id }
                          })
                          setIsTaskModalOpen(true)
                        }}
                      >
                        İlk Görevi Ekle
                      </Button>
                    </div>
                  ) : (
                    <HierarchicalTaskList
                      tasks={sectionTasks}
                      onToggleComplete={toggleTaskComplete}
                      onUpdate={updateTask}
                      onDelete={(taskId) => {
                        const taskToDelete = sectionTasks.find(t => t.id === taskId)
                        if (taskToDelete) {
                          const subTaskCount = taskToDelete.subTasks?.length || 0
                          setTaskToDelete({ 
                            id: taskId, 
                            title: taskToDelete.title,
                            subTaskCount: subTaskCount
                          })
                          setIsTaskDeleteDialogOpen(true)
                        }
                      }}
                      onPin={toggleTaskPin}
                      onEdit={handleEditTask}
                      onCopy={(taskId) => {
                        const taskToClone = sectionTasks.find(t => t.id === taskId)
                        if (taskToClone) {
                          setTaskToClone({
                            id: taskId,
                            title: taskToClone.title,
                            projectId: taskToClone.projectId,
                            sectionId: taskToClone.sectionId || undefined
                          })
                          setIsTaskCloneModalOpen(true)
                        }
                      }}
                      onMove={(taskId) => {
                        const taskToMove = sectionTasks.find(t => t.id === taskId)
                        if (taskToMove) {
                          setTaskToMove({
                            id: taskId,
                            title: taskToMove.title,
                            projectId: taskToMove.projectId,
                            sectionId: taskToMove.sectionId || undefined
                          })
                          setIsTaskMoveModalOpen(true)
                        }
                      }}
                      onAddSubTask={(parentTaskId) => {
                        const parentTask = sectionTasks.find(t => t.id === taskId)
                        setTaskModalContext({
                          project: { id: project.id, name: project.name, emoji: project.emoji },
                          section: { id: section.id, name: section.name, projectId: project.id },
                          parentTaskId: parentTaskId,
                          parentTaskTitle: parentTask?.title
                        })
                        setIsTaskModalOpen(true)
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
                      onComment={handleCommentTask}
                      showTreeConnectors={true}
                      enableDragAndDrop={false}
                      onMoveTask={async (taskId, newParentId) => {
                        try {
                          await updateTask(taskId, { parentTaskId: newParentId })
                        } catch (error) {
                          console.error('Failed to move task:', error)
                        }
                      }}
                      expandTaskId={expandTaskId}
                    />
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

      {/* Bölüm Ekleme/Düzenleme Modal'ı */}
      <NewSectionModal
        isOpen={isSectionModalOpen || !!editingSectionId}
        onClose={() => {
          setIsSectionModalOpen(false)
          setEditingSectionId(null)
          setEditingSectionName("")
        }}
        onSave={(name) => {
          if (editingSectionId) {
            handleUpdateSection(editingSectionId, name)
          } else {
            handleCreateSection(name)
          }
        }}
        editingSection={editingSectionId ? { id: editingSectionId, name: editingSectionName } : null}
        projectName={project?.name}
        projectEmoji={project?.emoji}
        existingSections={sections.map(section => section.name)}
      />

      {/* Bölüm Silme Onay Dialog'u */}
      <ConfirmationDialog
        isOpen={isSectionDeleteDialogOpen}
        onClose={() => {
          setIsSectionDeleteDialogOpen(false)
          setSectionToDelete(null)
        }}
        onConfirm={() => {
          if (sectionToDelete) {
            handleDeleteSection(sectionToDelete.id)
          }
        }}
        title="Bölümü Sil"
        message={`"${sectionToDelete?.name}" bölümünü silmek istediğinizden emin misiniz? Bu bölümdeki tüm görevler de silinecek.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />

      {/* Görev Silme Onay Dialog'u */}
      <TaskDeleteDialog
        isOpen={isTaskDeleteDialogOpen}
        onClose={() => {
          setIsTaskDeleteDialogOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={() => {
          if (taskToDelete) {
            handleDeleteTask(taskToDelete.id)
          }
        }}
        task={taskToDelete ? {
          id: taskToDelete.id,
          title: taskToDelete.title,
          subTasks: Array(taskToDelete.subTaskCount).fill({}).map((_, index) => ({
            id: `sub-${index}`,
            title: `Alt görev ${index + 1}`,
            completed: false
          }))
        } : null}
      />

      {/* Görev Ekleme Modal'ı */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskModalContext({})
          setEditingTask(null)
        }}
        onTaskCreated={async (newTask) => {
          if (!newTask) {
            // Fallback: Tüm verileri yenile
            await fetchProjectData()
          }
          // TaskStore otomatik olarak tüm UI'ı güncelleyecek
        }}
        defaultProject={taskModalContext.project}
        defaultSection={taskModalContext.section}
        parentTaskId={taskModalContext.parentTaskId}
        parentTaskTitle={taskModalContext.parentTaskTitle}
        editingTask={editingTask}
      />

      {/* Bölüm Taşıma Modal'ı */}
      <MoveSectionModal
        isOpen={isSectionMoveModalOpen}
        onClose={() => {
          setIsSectionMoveModalOpen(false)
          setSectionToMove(null)
        }}
        onMove={handleMoveSection}
        section={sectionToMove}
        currentProject={project ? { id: project.id, name: project.name, emoji: project.emoji } : undefined}
      />

      {/* Görev Klonlama Modal'ı */}
      <MoveTaskModal
        isOpen={isTaskCloneModalOpen}
        onClose={() => {
          setIsTaskCloneModalOpen(false)
          setTaskToClone(null)
        }}
        onMove={handleCloneTask}
        task={taskToClone}
        currentProject={project ? { id: project.id, name: project.name, emoji: project.emoji } : undefined}
        mode="clone"
      />

      {/* Görev Taşıma Modal'ı */}
      <MoveTaskModal
        isOpen={isTaskMoveModalOpen}
        onClose={() => {
          setIsTaskMoveModalOpen(false)
          setTaskToMove(null)
        }}
        onMove={handleMoveTask}
        task={taskToMove}
        currentProject={project ? { id: project.id, name: project.name, emoji: project.emoji } : undefined}
      />

      {/* Görev Yorumları Modal'ı */}
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

      {/* Proje Timeline Modal'ı */}
      <ProjectTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        projectId={projectId}
        projectTitle={project?.name || ''}
      />
      </div>
    </TooltipProvider>
  )
}