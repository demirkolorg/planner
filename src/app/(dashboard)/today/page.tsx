"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Sun, Folder, Tag, Flag, ArrowRight } from "lucide-react"
import Link from "next/link"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { Button } from "@/components/ui/button"

type ViewMode = 'simple' | 'project' | 'tag' | 'priority'

export default function TodayPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('simple')
  
  const { 
    tasks,
    fetchTasks,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    toggleTaskPin,
    updateTaskTags,
    updateTaskReminders,
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

  // Görevleri kategorilere ayır
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false
    const dueDate = new Date(task.dueDate)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dueDate < todayMidnight
  })

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
  const totalToday = todayTasks.length + overdueTasks.length
  const completedToday = completedTodayTasks.length
  const remainingToday = totalToday

  // Görünüm modları için gruplama fonksiyonları
  const allRelevantTasks = [...overdueTasks, ...todayTasks]

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

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    fetchTags()
    
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
          
          {/* Mini Stats */}
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
        </div>

        {/* View Mode Navigation */}
        <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 rounded-xl p-1">
          <Button
            variant={viewMode === 'simple' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('simple')}
            className={`h-8 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'simple' 
                ? 'bg-white dark:bg-gray-800 shadow-sm' 
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Sun className="h-4 w-4 mr-2" />
            Basit
          </Button>
          <Button
            variant={viewMode === 'project' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('project')}
            className={`h-8 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'project' 
                ? 'bg-white dark:bg-gray-800 shadow-sm' 
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Folder className="h-4 w-4 mr-2" />
            Proje
          </Button>
          <Button
            variant={viewMode === 'priority' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('priority')}
            className={`h-8 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'priority' 
                ? 'bg-white dark:bg-gray-800 shadow-sm' 
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Flag className="h-4 w-4 mr-2" />
            Öncelik
          </Button>
          <Button
            variant={viewMode === 'tag' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tag')}
            className={`h-8 px-3 rounded-lg transition-all duration-200 ${
              viewMode === 'tag' 
                ? 'bg-white dark:bg-gray-800 shadow-sm' 
                : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Tag className="h-4 w-4 mr-2" />
            Etiket
          </Button>
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
          {/* Geciken Görevler */}
          {overdueTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-red-50/60 to-orange-50/60 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200/40 dark:border-red-700/20 backdrop-blur-sm">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-900 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-red-700 dark:text-red-300">
                      Geciken Görevler
                    </h2>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Vadesi geçmiş
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-red-500 text-white text-sm font-semibold min-w-[24px] text-center">
                  {overdueTasks.length}
                </div>
              </div>
              <HierarchicalTaskList
                tasks={overdueTasks}
                onToggleComplete={toggleTaskComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
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
            </div>
          )}

          {/* Bugünkü Görevler */}
          {todayTasks.length > 0 ? (
            <HierarchicalTaskList
                tasks={todayTasks}
                onToggleComplete={toggleTaskComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
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
          ) : overdueTasks.length === 0 ? (
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
          ) : null}
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
              <div key={projectName} className="space-y-3">
                <Link 
                  href={group.project.id ? `/projects/${group.project.id}` : '#'}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 border border-gray-200/40 dark:border-gray-700/20 hover:border-gray-300/60 dark:hover:border-gray-600/40 backdrop-blur-sm transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-2.5">
                    <div>
                      {group.project.emoji ? (
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm">
                          <span className="text-sm">{group.project.emoji}</span>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        {projectName}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.tasks.length} görev
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-0.5" />
                </Link>
                <HierarchicalTaskList
                  tasks={group.tasks}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
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
              </div>
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
                <div key={priority} className="space-y-3">
                  <div className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 border border-gray-200/40 dark:border-gray-700/20 backdrop-blur-sm">
                    <div>
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shadow-sm ${priorityColors[priority as keyof typeof priorityColors]}`}>
                        <span className="text-sm">{priorityIcons[priority as keyof typeof priorityIcons]}</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.priority}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.tasks.length} görev
                      </p>
                    </div>
                  </div>
                  <HierarchicalTaskList
                    tasks={group.tasks}
                    onToggleComplete={toggleTaskComplete}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
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
                </div>
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
              <div key={tagName} className="space-y-3">
                <Link 
                  href={group.tag.id ? `/tags/${group.tag.id}` : '#'}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-900/60 border border-gray-200/40 dark:border-gray-700/20 hover:border-gray-300/60 dark:hover:border-gray-600/40 backdrop-blur-sm transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-2.5">
                    <div>
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${group.tag.color}20` }}
                      >
                        <Tag className="h-4 w-4" style={{ color: group.tag.color }} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                        {tagName}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {group.tasks.length} görev
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors group-hover:translate-x-0.5" />
                </Link>
                <HierarchicalTaskList
                  tasks={group.tasks}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
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
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Tamamlanan Görevler */}
      {completedTodayTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-green-50/60 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/40 dark:border-green-700/20 backdrop-blur-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900 flex items-center justify-center shadow-sm">
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
            <div className="px-2 py-1 rounded-lg bg-green-500 text-white text-sm font-semibold min-w-[24px] text-center">
              {completedTodayTasks.length}
            </div>
          </div>
          <HierarchicalTaskList
            tasks={completedTodayTasks}
            onToggleComplete={toggleTaskComplete}
            onUpdate={updateTask}
            onDelete={deleteTask}
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
        </div>
      )}
    </div>
  )
}