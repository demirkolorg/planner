"use client"

import { useEffect, useState } from "react"
import { Pin, Folder, Tag, Flag, ArrowRight, ChevronDown } from "lucide-react"
import Link from "next/link"
import { HierarchicalTaskList } from "@/components/task/hierarchical-task-list"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type ViewMode = 'simple' | 'project' | 'tag' | 'priority'

export default function BoardPage() {
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
    getPinnedTasks,
    cloneTask,
    addSubTask,
  } = useTaskStore()
  
  const { projects, fetchProjects } = useProjectStore()
  const { fetchTags } = useTagStore()

  // Tarih formatlama fonksiyonları
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

  // Pin edilmiş görevleri kategorilere ayır
  const pinnedTasks = getPinnedTasks()

  // Bugün pin edilen görevler
  const today = new Date()
  const todayStr = today.getFullYear() + '-' + 
                  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(today.getDate()).padStart(2, '0')

  const pinnedTodayTasks = pinnedTasks.filter(task => {
    if (!task.updatedAt) return false
    const taskUpdatedDate = new Date(task.updatedAt)
    const taskDateStr = taskUpdatedDate.getFullYear() + '-' + 
                       String(taskUpdatedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(taskUpdatedDate.getDate()).padStart(2, '0')
    return taskDateStr === todayStr
  })

  // Bu hafta pin edilen görevler
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const pinnedThisWeekTasks = pinnedTasks.filter(task => {
    if (!task.updatedAt) return false
    const taskUpdatedDate = new Date(task.updatedAt)
    return taskUpdatedDate >= startOfWeek
  })

  // Bu ay pin edilen görevler
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const pinnedThisMonthTasks = pinnedTasks.filter(task => {
    if (!task.updatedAt) return false
    const taskUpdatedDate = new Date(task.updatedAt)
    return taskUpdatedDate >= startOfMonth
  })

  // İstatistikler
  const totalPinned = pinnedTasks.length
  const pinnedToday = pinnedTodayTasks.length
  const pinnedThisWeek = pinnedThisWeekTasks.length
  const pinnedThisMonth = pinnedThisMonthTasks.length

  // Görünüm modları için gruplama fonksiyonları
  const groupTasksByProject = () => {
    const grouped: Record<string, {
      project: { id?: string; name: string; emoji?: string }
      tasks: typeof pinnedTasks
    }> = {}
    pinnedTasks.forEach(task => {
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
      tasks: typeof pinnedTasks
    }> = {}
    pinnedTasks.forEach(task => {
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
      tasks: typeof pinnedTasks
    }> = {}
    priorityOrder.forEach(priority => {
      const tasksWithPriority = pinnedTasks.filter(task => task.priority === priority)
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
    Promise.all([
      fetchTasks(),
      fetchProjects(),
      fetchTags()
    ]).catch(error => {
      console.error('Failed to fetch board data:', error)
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-destructive flex items-center justify-center shadow-lg">
              <Pin className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                Pano
              </h1>
              <p className="text-muted-foreground">
                {formatToTurkishDate(today)}
              </p>
            </div>
          </div>
          
          {/* Mini Stats - Centered */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pinnedToday}</div>
              <div className="text-xs text-muted-foreground">bugün</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{pinnedThisWeek}</div>
              <div className="text-xs text-muted-foreground">bu hafta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{pinnedThisMonth}</div>
              <div className="text-xs text-muted-foreground">bu ay</div>
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
              <Pin className="h-4 w-4 mr-2" />
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

      {/* Progress Bar - Pinned Tasks Overview */}
      {totalPinned > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-destructive/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Toplam Sabitlenmiş</span>
            <span className="text-sm text-muted-foreground">
              {totalPinned} görev
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="text-center">
              <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="text-xs text-primary font-medium">
                Bugün: {pinnedToday}
              </div>
            </div>
            <div className="text-center">
              <div className="w-full h-2 bg-destructive/20 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-destructive to-destructive rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="text-xs text-destructive font-medium">
                Bu Hafta: {pinnedThisWeek}
              </div>
            </div>
            <div className="text-center">
              <div className="w-full h-2 bg-accent/20 rounded-full overflow-hidden mb-1">
                <div 
                  className="h-full bg-gradient-to-r from-accent to-accent rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="text-xs text-accent font-medium">
                Bu Ay: {pinnedThisMonth}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Content */}
      {viewMode === 'simple' ? (
        <>
          {/* Pin edilmiş Görevler */}
          {pinnedTasks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shadow-sm">
                    <Pin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-primary">
                      Sabitlenmiş Görevler
                    </h2>
                    <p className="text-xs text-primary">
                      Önemli görevlerin panosi
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold min-w-[24px] text-center">
                  {pinnedTasks.length}
                </div>
              </div>
              <HierarchicalTaskList
                tasks={pinnedTasks}
                onToggleComplete={toggleTaskComplete}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onPin={toggleTaskPin}
                onEdit={(task) => {
                  // Task düzenleme handler'ı - modal açma veya inline edit
                  console.log('Edit task:', task.id)
                }}
                onCopy={async (taskId) => {
                  try {
                    await cloneTask(taskId)
                  } catch (error) {
                    console.error('Failed to copy task:', error)
                  }
                }}
                onMove={async (taskId) => {
                  // Move task handler'ı - proje/section seçim modal'ı açma
                  console.log('Move task:', taskId)
                }}
                onAddSubTask={async (parentTaskId) => {
                  try {
                    const parentTask = tasks.find(t => t.id === parentTaskId)
                    if (parentTask) {
                      await addSubTask(parentTaskId, {
                        title: 'Yeni alt görev',
                        projectId: parentTask.projectId,
                        sectionId: parentTask.sectionId
                      })
                    }
                  } catch (error) {
                    console.error('Failed to add subtask:', error)
                  }
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
                              />
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-destructive/10 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Pin className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Henüz sabitlenmiş görev yok
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Önemli görevleri sabitle ve panonda görüntüle. Hızlı eriş, öncelikli işleri takip et!
              </p>
            </div>
          )}
        </>
      ) : viewMode === 'project' ? (
        /* Project View */
        <div className="space-y-6">
          {Object.entries(groupTasksByProject()).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-destructive/10 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Folder className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Henüz sabitlenmiş görev yok
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Hiçbir projede sabitlenmiş görev bulunmuyor.
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
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shadow-sm">
                            <span className="text-sm">{group.project.emoji}</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-md bg-muted shadow-sm" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                          {projectName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {group.tasks.length} sabitlenmiş görev
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
                    onDelete={deleteTask}
                    onPin={toggleTaskPin}
                    onEdit={(task) => {
                      // Task düzenleme handler'ı - modal açma veya inline edit
                      console.log('Edit task:', task.id)
                    }}
                    onCopy={async (taskId) => {
                      try {
                        await cloneTask(taskId)
                      } catch (error) {
                        console.error('Failed to copy task:', error)
                      }
                    }}
                    onMove={async (taskId) => {
                      // Move task handler'ı - proje/section seçim modal'ı açma
                      console.log('Move task:', taskId)
                    }}
                    onAddSubTask={async (parentTaskId) => {
                      try {
                        const parentTask = tasks.find(t => t.id === parentTaskId)
                        if (parentTask) {
                          await addSubTask(parentTaskId, {
                            title: 'Yeni alt görev',
                            projectId: parentTask.projectId,
                            sectionId: parentTask.sectionId
                          })
                        }
                      } catch (error) {
                        console.error('Failed to add subtask:', error)
                      }
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
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-destructive/10 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Flag className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Henüz sabitlenmiş görev yok
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Hiçbir öncelik seviyesinde sabitlenmiş görev bulunmuyor.
              </p>
            </div>
          ) : (
            Object.entries(groupTasksByPriority()).map(([priority, group]) => {
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
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shadow-sm">
                            <span className="text-sm">{priorityIcons[priority as keyof typeof priorityIcons]}</span>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-medium text-foreground">
                            {group.priority}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {group.tasks.length} sabitlenmiş görev
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
                      onDelete={deleteTask}
                      onPin={toggleTaskPin}
                      onEdit={(task) => {
                        // Task düzenleme handler'ı - modal açma veya inline edit
                        console.log('Edit task:', task.id)
                      }}
                      onCopy={async (taskId) => {
                        try {
                          await cloneTask(taskId)
                        } catch (error) {
                          console.error('Failed to copy task:', error)
                        }
                      }}
                      onMove={async (taskId) => {
                        // Move task handler'ı - proje/section seçim modal'ı açma
                        console.log('Move task:', taskId)
                      }}
                      onAddSubTask={async (parentTaskId) => {
                        try {
                          const parentTask = tasks.find(t => t.id === parentTaskId)
                          if (parentTask) {
                            await addSubTask(parentTaskId, {
                              title: 'Yeni alt görev',
                              projectId: parentTask.projectId,
                              sectionId: parentTask.sectionId
                            })
                          }
                        } catch (error) {
                          console.error('Failed to add subtask:', error)
                        }
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
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-destructive/10 flex items-center justify-center shadow-lg mx-auto mb-6">
                <Tag className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Henüz sabitlenmiş görev yok
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Hiçbir etikette sabitlenmiş görev bulunmuyor.
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
                          {group.tasks.length} sabitlenmiş görev
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
                    onDelete={deleteTask}
                    onPin={toggleTaskPin}
                    onEdit={(task) => {
                      // Task düzenleme handler'ı - modal açma veya inline edit
                      console.log('Edit task:', task.id)
                    }}
                    onCopy={async (taskId) => {
                      try {
                        await cloneTask(taskId)
                      } catch (error) {
                        console.error('Failed to copy task:', error)
                      }
                    }}
                    onMove={async (taskId) => {
                      // Move task handler'ı - proje/section seçim modal'ı açma
                      console.log('Move task:', taskId)
                    }}
                    onAddSubTask={async (parentTaskId) => {
                      try {
                        const parentTask = tasks.find(t => t.id === parentTaskId)
                        if (parentTask) {
                          await addSubTask(parentTaskId, {
                            title: 'Yeni alt görev',
                            projectId: parentTask.projectId,
                            sectionId: parentTask.sectionId
                          })
                        }
                      } catch (error) {
                        console.error('Failed to add subtask:', error)
                      }
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
                  />
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}