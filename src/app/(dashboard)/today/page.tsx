"use client"

import { useEffect, useState, useCallback } from "react"
import { CheckCircle2, Sun, Folder, Tag, Flag, ArrowRight, ChevronDown, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"

type ViewMode = 'simple' | 'project' | 'tag' | 'priority'

export default function TodayPage() {
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
  const [editingTask, setEditingTask] = useState<any | null>(null)
  
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
  const todayStr = today.getFullYear() + '-' + 
                  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(today.getDate()).padStart(2, '0')

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

  // Sadece bugün tarihli görevleri filtrele
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false
    const taskDueDate = new Date(task.dueDate)
    const taskDateStr = taskDueDate.getFullYear() + '-' + 
                       String(taskDueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(taskDueDate.getDate()).padStart(2, '0')
    
    return taskDateStr === todayStr
  })

  const completedTodayTasks = tasks.filter(task => {
    if (!task.dueDate || !task.completed) return false
    const taskDueDate = new Date(task.dueDate)
    const taskDateStr = taskDueDate.getFullYear() + '-' + 
                       String(taskDueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(taskDueDate.getDate()).padStart(2, '0')
    return taskDateStr === todayStr
  })

  // İstatistikler
  const totalToday = todayTasks.length
  const completedToday = completedTodayTasks.length
  const remainingToday = totalToday

  // Görünüm modları için gruplama fonksiyonları
  const allRelevantTasks = [...todayTasks]

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

  // Handler functions
  const handleEditTask = useCallback((task: any) => {
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
      console.error('Failed to fetch today page data:', error)
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Sun className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                Bugün
              </h1>
              <p className="text-muted-foreground">
                {formatToTurkishDate(today)}
              </p>
            </div>
          </div>
          
          {/* Mini Stats - Centered */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{remainingToday}</div>
              <div className="text-xs text-muted-foreground">yapılacak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedToday}</div>
              <div className="text-xs text-muted-foreground">tamamlandı</div>
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
              <Sun className="h-4 w-4 mr-2" />
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

      {/* Progress Bar */}
      {totalToday > 0 && (
        <div className="bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Günlük İlerleme</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((completedToday / (totalToday + completedToday)) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ 
                width: `${totalToday + completedToday > 0 ? (completedToday / (totalToday + completedToday)) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* View Mode Content */}
      {viewMode === 'simple' ? (
        <>
          {/* Bugünkü Görevler - Saatlere göre organize edilmiş */}
          {todayTasks.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                // Görevleri saate göre grupla
                const tasksByHour: Record<string, typeof todayTasks> = {
                  'all-day': []
                }
                
                // Tüm saatler için boş array'ler oluştur
                for (let hour = 0; hour < 24; hour++) {
                  tasksByHour[hour.toString().padStart(2, '0')] = []
                }
                
                // Görevleri saatlerine göre grupla
                todayTasks.forEach(task => {
                  if (!task.dueDate) {
                    tasksByHour['all-day'].push(task)
                  } else {
                    const dueDate = new Date(task.dueDate)
                    const hours = dueDate.getHours()
                    const minutes = dueDate.getMinutes()
                    
                    // Eğer saat 00:00 ise tüm gün olarak kabul et
                    if (hours === 0 && minutes === 0) {
                      tasksByHour['all-day'].push(task)
                    } else {
                      tasksByHour[hours.toString().padStart(2, '0')].push(task)
                    }
                  }
                })
                
                // Önce tüm gün görevlerini göster
                const sections = []
                
                if (tasksByHour['all-day'].length > 0) {
                  sections.push(
                    <div key="all-day" className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Tüm Gün</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {tasksByHour['all-day'].length}
                        </span>
                      </div>
                      <div className="pl-6">
                        <HierarchicalTaskList
                          tasks={tasksByHour['all-day']}
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
                    </div>
                  )
                }
                
                // Sonra saatli görevleri göster
                for (let hour = 0; hour < 24; hour++) {
                  const hourStr = hour.toString().padStart(2, '0')
                  const hourTasks = tasksByHour[hourStr]
                  
                  if (hourTasks.length > 0) {
                    sections.push(
                      <div key={hourStr} className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{hourStr}:00</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {hourTasks.length}
                          </span>
                        </div>
                        <div className="pl-6">
                          <HierarchicalTaskList
                            tasks={hourTasks}
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
                      </div>
                    )
                  }
                }
                
                return sections
              })()}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/20 dark:to-orange-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bugün için görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Harika! Bugün için planlanmış görevin yok. Dinlenme zamanın ya da yeni hedefler belirleme fırsatın.
              </p>
            </div>
          )}
        </>
      ) : viewMode === 'project' ? (
        /* Project View */
        <div className="space-y-6">
          {Object.entries(groupTasksByProject()).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/20 dark:to-orange-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Folder className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bugün için görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Bugün tarihi için hiçbir projede görev bulunmuyor.
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
                          {group.tasks.length} görev
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
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/20 dark:to-orange-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Flag className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bugün için görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Bugün tarihi için hiçbir öncelik seviyesinde görev bulunmuyor.
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
                            {group.tasks.length} görev
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
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/20 dark:to-orange-800/20 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Tag className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Bugün için görev yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Bugün tarihi için hiçbir etikette görev bulunmuyor.
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
                          {group.tasks.length} görev
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

      {/* Tamamlanan Görevler */}
      {completedTodayTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-800/50 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-green-700 dark:text-green-300">
                  Tamamlanan Görevler
                </h2>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Bugün tamamlandı
                </p>
              </div>
            </div>
            <div className="px-2 py-1 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-semibold min-w-[24px] text-center">
              {completedTodayTasks.length}
            </div>
          </div>
          <HierarchicalTaskList
            tasks={completedTodayTasks}
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
      )}

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