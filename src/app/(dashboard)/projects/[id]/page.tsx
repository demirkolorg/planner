"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, MoreVertical, Plus, Settings, Clock, FolderClosed, Check, Archive, Trash, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useProjectStore } from "@/store/projectStore"
import { useTaskStore } from "@/store/taskStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { NewSectionModal } from "@/components/modals/new-section-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveSectionModal } from "@/components/modals/move-section-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { TaskCard } from "@/components/task/task-card"

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
  const { updateProject, deleteProject, fetchSections, getSectionsByProject, createSection, updateSection, deleteSection, moveSection } = useProjectStore()
  const { 
    fetchTasksByProject, 
    createTask, 
    getTasksByProject, 
    getTasksBySection,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    toggleTaskPin,
    addSubTask,
    updateTaskTags,
    updateTaskReminders,
    showCompletedTasks,
    toggleShowCompletedTasks,
    getCompletedTasksCount,
    getPendingTasksCount,
    getOverdueTasksByProject,
    getOverdueTasksCountByProject
  } = useTaskStore()

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
      setOpenSections(sectionsToOpen)
    }
  }, [sectionIds.length, getOverdueTasksCountByProject, projectId]) // sadece length değişimini takip et

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
              {project.emoji ? (
                <span className="text-xl">{project.emoji}</span>
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Check className="h-3 w-3 text-green-600" />
                  <span>{getCompletedTasksCount(projectId)}</span>
                </div>
                <div className="flex items-center space-x-1">  
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span>{getPendingTasksCount(projectId)}</span>
                </div>
                {getOverdueTasksCountByProject(projectId) > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-red-600 font-medium">{getOverdueTasksCountByProject(projectId)} gecikme</span>
                  </div>
                )}
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ 
                      width: `${((getCompletedTasksCount(projectId) / (getCompletedTasksCount(projectId) + getPendingTasksCount(projectId))) || 0) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {Math.round(((getCompletedTasksCount(projectId) / (getCompletedTasksCount(projectId) + getPendingTasksCount(projectId))) || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
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
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                İşlemler
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setIsSectionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Bölüm Ekle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Projeyi Düzenle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleShowCompletedTasks}>
                {showCompletedTasks ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showCompletedTasks ? 'Tamamlananları Gizle' : 'Tamamlananları Göster'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Projeyi Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Proje Notları */}
      {isEditingNotes ? (
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
      )}

      {/* Bölümler ve Görevler */}
      {sections.length === 0 && getOverdueTasksByProject(projectId).length === 0 ? (
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
        <Accordion type="multiple" className="w-full space-y-2 overflow-visible" value={openSections} onValueChange={setOpenSections}>
          {/* Süresi Geçmiş Görevler Accordion */}
          {getOverdueTasksByProject(projectId).length > 0 && (
            <AccordionItem key="overdue-tasks" value="overdue-tasks" className="border-none overflow-visible">
              <AccordionTrigger className="px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border-b border-red-200 dark:border-red-800 mb-1 transition-colors hover:no-underline w-full bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 flex-1">
                    <ChevronDown className="h-4 w-4 text-red-600" />
                    <h3 className="text-sm font-medium text-red-700 dark:text-red-400">Süresi Geçmiş Görevler</h3>
                    <span className="text-xs text-red-600 dark:text-red-500">
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
                  onDelete={deleteTask}
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
                  showTreeConnectors={true}
                  enableDragAndDrop={true}
                  onMoveTask={async (taskId, newParentId) => {
                    try {
                      await updateTask(taskId, { parentTaskId: newParentId })
                    } catch (error) {
                      console.error('Failed to move task:', error)
                    }
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          )}
          
          {sections.map((section) => {
            const sectionTasks = getTasksBySection(section.id)
            const isOpen = openSections.includes(section.id)
            
            return (
              <AccordionItem key={section.id} value={section.id} className="border-none overflow-visible">
                <AccordionTrigger className="px-4 py-2 hover:bg-accent/50 rounded-lg border-b-1 mb-1 transition-colors hover:no-underline w-full">
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
                  {sectionTasks.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
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
                      onDelete={deleteTask}
                      onPin={toggleTaskPin}
                      onAddSubTask={(parentTaskId) => {
                        const parentTask = sectionTasks.find(t => t.id === parentTaskId)
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
                      showTreeConnectors={true}
                      enableDragAndDrop={true}
                      onMoveTask={async (taskId, newParentId) => {
                        try {
                          await updateTask(taskId, { parentTaskId: newParentId })
                        } catch (error) {
                          console.error('Failed to move task:', error)
                        }
                      }}
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

      {/* Görev Ekleme Modal'ı */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskModalContext({})
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
    </div>
  )
}