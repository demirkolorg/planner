"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertTriangle, CheckCircle2, CalendarX, Folder, Tag, Flag, ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { useTaskStore } from "@/store/taskStore"

interface TaskWithRelations {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  projectId: string
  sectionId?: string
  userId: string
  createdAt: string
  updatedAt: string
  level?: number
  project?: {
    id: string
    name: string
    emoji?: string
  }
  section?: {
    id: string
    name: string
  }
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
  subTasks?: Array<{
    id: string
    title: string
    completed: boolean
    priority: string
    createdAt: string
    updatedAt: string
  }>
}
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"

type ViewMode = 'simple' | 'project' | 'tag' | 'priority'

export default function OverduePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('simple')
  
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
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  
  const { 
    tasks,
    fetchTasks,
    toggleTaskComplete,
    updateTask,
    deleteTask: deleteTaskFromStore,
    toggleTaskPin,
    updateTaskTags,
    updateTaskReminders,
    addSubTask,
    cloneTask,
    moveTask,
  } = useTaskStore()
  
  const { projects, fetchProjects } = useProjectStore()
  const { fetchTags } = useTagStore()

  // Bugünün tarihi (local timezone)
  const today = new Date()

  const formatToTurkishDate = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${monthName} ${year}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  // Gecikmiş görevleri filtrele
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false
    const dueDate = new Date(task.dueDate)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dueDate < todayMidnight
  })

  // İstatistikler
  const totalOverdue = overdueTasks.length
  const remainingOverdue = totalOverdue

  // Görünüm modları için gruplama fonksiyonları
  const allRelevantTasks = [...overdueTasks]

  const groupTasksByProject = () => {
    const grouped: Record<string, {
      project: { id?: string; name: string; emoji?: string }
      tasks: typeof allRelevantTasks
    }> = {}
    allRelevantTasks.forEach(task => {
      const project = projects.find(p => p.id === task.projectId)
      const projectName = project?.name || 'Bilinmeyen Proje'
      if (!grouped[projectName]) {
        grouped[projectName] = {
          project: project || { name: projectName, emoji: '📁' },
          tasks: []
        }
      }
      grouped[projectName].tasks.push(task)
    })
    return grouped
  }

  const groupTasksByTag = () => {
    const grouped: Record<string, {
      tag: { id?: string; name: string; color: string }
      tasks: typeof allRelevantTasks
    }> = {}
    allRelevantTasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach((taskTag: { tag: { id: string; name: string; color: string } }) => {
          const tagName = taskTag.tag.name
          if (!grouped[tagName]) {
            grouped[tagName] = {
              tag: taskTag.tag,
              tasks: []
            }
          }
          grouped[tagName].tasks.push(task)
        })
      } else {
        if (!grouped['Etiketsiz']) {
          grouped['Etiketsiz'] = {
            tag: { name: 'Etiketsiz', color: '#gray' },
            tasks: []
          }
        }
        grouped['Etiketsiz'].tasks.push(task)
      }
    })
    return grouped
  }

  const groupTasksByPriority = () => {
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
    const priorityNames = {
      'CRITICAL': 'Kritik',
      'HIGH': 'Yüksek', 
      'MEDIUM': 'Orta',
      'LOW': 'Düşük',
      'NONE': 'Önceliksiz'
    }
    
    const grouped: Record<string, {
      priority: string
      tasks: typeof allRelevantTasks
    }> = {}
    priorityOrder.forEach(priority => {
      const tasksWithPriority = allRelevantTasks.filter(task => task.priority === priority)
      if (tasksWithPriority.length > 0) {
        grouped[priority] = {
          priority: priorityNames[priority as keyof typeof priorityNames],
          tasks: tasksWithPriority
        }
      }
    })
    return grouped
  }

  // Görevleri gecikme süresine göre grupla
  const groupTasksByOverdueDuration = () => {
    const now = new Date()
    const groups = {
      'Bugün gecikti': [] as typeof overdueTasks,
      '1-3 gün gecikti': [] as typeof overdueTasks,
      '4-7 gün gecikti': [] as typeof overdueTasks,
      '1-2 hafta gecikti': [] as typeof overdueTasks,
      '2+ hafta gecikti': [] as typeof overdueTasks
    }

    overdueTasks.forEach(task => {
      if (!task.dueDate) return
      
      const dueDate = new Date(task.dueDate)
      const diffInDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) {
        groups['Bugün gecikti'].push(task)
      } else if (diffInDays >= 1 && diffInDays <= 3) {
        groups['1-3 gün gecikti'].push(task)
      } else if (diffInDays >= 4 && diffInDays <= 7) {
        groups['4-7 gün gecikti'].push(task)
      } else if (diffInDays >= 8 && diffInDays <= 14) {
        groups['1-2 hafta gecikti'].push(task)
      } else {
        groups['2+ hafta gecikti'].push(task)
      }
    })

    return groups
  }

  // Handler functions
  const handleEditTask = useCallback((task: TaskWithRelations) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ id: taskId, title: task.title, subTaskCount })
      setIsTaskDeleteDialogOpen(true)
    }
  }, [tasks])

  const handleCloneTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      // Optimistic UI updates
      setIsTaskCloneModalOpen(false)
      setTaskToClone(null)
      
      // Execute clone and refresh in parallel where possible
      const [cloneResult] = await Promise.allSettled([
        cloneTask(taskId, targetProjectId, targetSectionId)
      ])
      
      // Refresh only if clone was successful
      if (cloneResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Clone failed:', cloneResult.reason)
      }
    } catch (error) {
      console.error('Failed to clone task:', error)
    }
  }, [cloneTask, fetchTasks])

  const handleMoveTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      // Optimistic UI updates
      setIsTaskMoveModalOpen(false)
      setTaskToMove(null)
      
      // Execute move and refresh in parallel where possible
      const [moveResult] = await Promise.allSettled([
        moveTask(taskId, targetProjectId, targetSectionId)
      ])
      
      // Refresh only if move was successful
      if (moveResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Move failed:', moveResult.reason)
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }, [moveTask, fetchTasks])

  const handleAddSubTask = useCallback((parentTaskId: string) => {
    const parentTask = tasks.find(t => t.id === parentTaskId)
    const project = parentTask ? projects.find(p => p.id === parentTask.projectId) : null
    
    // Parent task'ın section'ını kullan, yoksa default section oluştur
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
  }, [tasks, projects])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskToCopy = tasks.find(t => t.id === taskId)
    if (taskToCopy) {
      setTaskToClone({
        id: taskId,
        title: taskToCopy.title,
        projectId: taskToCopy.projectId,
        sectionId: undefined
      })
      setIsTaskCloneModalOpen(true)
    }
  }, [tasks])

  const handleMoveTaskModal = useCallback((taskId: string) => {
    const taskToMoveItem = tasks.find(t => t.id === taskId)
    if (taskToMoveItem) {
      setTaskToMove({
        id: taskId,
        title: taskToMoveItem.title,
        projectId: taskToMoveItem.projectId,
        sectionId: undefined
      })
      setIsTaskMoveModalOpen(true)
    }
  }, [tasks])

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProjects(),
      fetchTags()
    ]).catch(error => {
      console.error('Failed to fetch overdue page data:', error)
    })
    
    // Saati her dakika güncelle
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [fetchTasks, fetchProjects, fetchTags])

  return (
    <div className="space-y-6">
      {/* Header with View Modes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <CalendarX className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                Gecikmiş Görevler
              </h1>
              <p className="text-muted-foreground">
                Vadesi geçmiş görevleriniz - {formatToTurkishDate(today)}
              </p>
            </div>
          </div>
          
          {/* Mini Stats - Centered */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{remainingOverdue}</div>
              <div className="text-xs text-muted-foreground">gecikmiş görev</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-muted-foreground">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground">şu an</div>
            </div>
          </div>

          {/* View Mode Navigation - Right Aligned */}
          <div className="flex items-center space-x-1 bg-muted/50 border border-border rounded-xl p-1">
            <Button
              variant={viewMode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('simple')}
              className="h-8 px-3 rounded-lg"
            >
              <CalendarX className="h-4 w-4 mr-2" />
              Basit
            </Button>
            <Button
              variant={viewMode === 'project' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('project')}
              className="h-8 px-3 rounded-lg"
            >
              <Folder className="h-4 w-4 mr-2" />
              Proje
            </Button>
            <Button
              variant={viewMode === 'priority' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('priority')}
              className="h-8 px-3 rounded-lg"
            >
              <Flag className="h-4 w-4 mr-2" />
              Öncelik
            </Button>
            <Button
              variant={viewMode === 'tag' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tag')}
              className="h-8 px-3 rounded-lg"
            >
              <Tag className="h-4 w-4 mr-2" />
              Etiket
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'simple' ? (
        <>
          {/* Gecikmiş Görevler - Duration-based grouping */}
          {overdueTasks.length > 0 ? (
            <div className="space-y-6">
              {(() => {
                const groups = groupTasksByOverdueDuration()
                const groupOrder = ['2+ hafta gecikti', '1-2 hafta gecikti', '4-7 gün gecikti', '1-3 gün gecikti', 'Bugün gecikti']
                
                return groupOrder.map(groupName => {
                  const tasksInGroup = groups[groupName as keyof typeof groups]
                  if (tasksInGroup.length === 0) return null
                  
                  const getGroupColor = (name: string) => {
                    switch (name) {
                      case 'Bugün gecikti': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      case '1-3 gün gecikti': return 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                      case '4-7 gün gecikti': return 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      case '1-2 hafta gecikti': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      case '2+ hafta gecikti': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                      default: return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }
                  }
                  
                  const getGroupTextColor = (name: string) => {
                    switch (name) {
                      case 'Bugün gecikti': return 'text-red-700 dark:text-red-300'
                      case '1-3 gün gecikti': return 'text-orange-700 dark:text-orange-300'
                      case '4-7 gün gecikti': return 'text-amber-700 dark:text-amber-300'
                      case '1-2 hafta gecikti': return 'text-yellow-700 dark:text-yellow-300'
                      case '2+ hafta gecikti': return 'text-purple-700 dark:text-purple-300'
                      default: return 'text-red-700 dark:text-red-300'
                    }
                  }
                  
                  return (
                    <div key={groupName} className="space-y-3">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${getGroupColor(groupName)}`}>
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-md bg-white/50 dark:bg-black/20 flex items-center justify-center shadow-sm">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <h2 className={`text-sm font-medium ${getGroupTextColor(groupName)}`}>
                              {groupName}
                            </h2>
                            <p className={`text-xs ${getGroupTextColor(groupName)}/70`}>
                              Acil eylem gerekli
                            </p>
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-red-600 text-white text-sm font-semibold min-w-[24px] text-center">
                          {tasksInGroup.length}
                        </div>
                      </div>
                      <HierarchicalTaskList
                        tasks={tasksInGroup}
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
                      />
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gecikmiş görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Harika! Vadesi geçmiş hiçbir görevin yok. Tüm görevlerin zamanında tamamlanıyor.
              </p>
            </div>
          )}
        </>
      ) : viewMode === 'project' ? (
        /* Project View */
        <div className="space-y-6">
          {Object.entries(groupTasksByProject()).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Folder className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gecikmiş görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Hiçbir projede gecikmiş görev bulunmuyor.
              </p>
            </div>
          ) : (
            Object.entries(groupTasksByProject()).map(([projectName, group]) => (
              <Collapsible key={projectName} defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <div className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-all duration-200 hover:shadow-sm cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <div>
                        {group.project.emoji ? (
                          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shadow-sm">
                            <span className="text-sm">{group.project.emoji}</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-primary shadow-sm" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                          {projectName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {group.tasks.length} gecikmiş görev
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={group.project.id ? `/projects/${group.project.id}` : '#'}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </Link>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <HierarchicalTaskList
                    tasks={group.tasks}
                    onToggleComplete={toggleTaskComplete}
                    onUpdate={updateTask}
                    onDelete={handleDeleteTask}
                    onPin={toggleTaskPin}
                    onAddSubTask={() => {}}
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
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      ) : viewMode === 'priority' ? (
        /* Priority View */
        <div className="space-y-6">
          {Object.entries(groupTasksByPriority()).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Flag className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gecikmiş görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Hiçbir öncelik seviyesinde gecikmiş görev bulunmuyor.
              </p>
            </div>
          ) : (
            Object.entries(groupTasksByPriority()).map(([priority, group]) => {
              const priorityColors = {
                'CRITICAL': 'bg-red-100 dark:bg-red-900/20',
                'HIGH': 'bg-orange-100 dark:bg-orange-900/20',
                'MEDIUM': 'bg-yellow-100 dark:bg-yellow-900/20',
                'LOW': 'bg-blue-100 dark:bg-blue-900/20',
                'NONE': 'bg-gray-100 dark:bg-gray-900/20'
              }
              const priorityIcons = {
                'CRITICAL': '🔴',
                'HIGH': '🟠', 
                'MEDIUM': '🟡',
                'LOW': '🔵',
                'NONE': '⚪'
              }
              
              return (
                <Collapsible key={priority} defaultOpen={false}>
                  <CollapsibleTrigger asChild>
                    <div className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-all duration-200 hover:shadow-sm cursor-pointer">
                      <div className="flex items-center space-x-2.5">
                        <div>
                          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shadow-sm">
                            <span className="text-sm">{priorityIcons[priority as keyof typeof priorityIcons]}</span>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-medium text-foreground">
                            {group.priority}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {group.tasks.length} gecikmiş görev
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <HierarchicalTaskList
                      tasks={group.tasks}
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
                    />
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      ) : viewMode === 'tag' ? (
        /* Tag View */
        <div className="space-y-6">
          {Object.entries(groupTasksByTag()).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Tag className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Gecikmiş görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Hiçbir etikette gecikmiş görev bulunmuyor.
              </p>
            </div>
          ) : (
            Object.entries(groupTasksByTag()).map(([tagName, group]) => (
              <Collapsible key={tagName} defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <div className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-all duration-200 hover:shadow-sm cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <div>
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm"
                          style={{ 
                            backgroundColor: group.tag.color ? `${group.tag.color}20` : '#e5e7eb',
                            border: `1px solid ${group.tag.color ? `${group.tag.color}40` : '#d1d5db'}`
                          }}
                        >
                          <Tag className="h-4 w-4" style={{ color: group.tag.color || '#6b7280' }} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                          {tagName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {group.tasks.length} gecikmiş görev
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={group.tag.id ? `/tags/${group.tag.id}` : '#'}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </Link>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <HierarchicalTaskList
                    tasks={group.tasks}
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
                  />
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      ) : null}


      {/* Modals */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskModalContext({})
          setEditingTask(null)
        }}
        onTaskCreated={async (newTask) => {
          try {
            console.log('onTaskCreated called with:', newTask)
            console.log('taskModalContext.parentTaskId:', taskModalContext.parentTaskId)
            
            if (taskModalContext.parentTaskId) {
              console.log('Calling addSubTask with:', taskModalContext.parentTaskId, newTask)
              await addSubTask(taskModalContext.parentTaskId, newTask)
            }
            await fetchTasks()
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
              await fetchTasks()
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