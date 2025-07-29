"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  Target,
  Activity,
  BarChart3,
  ArrowRight,
  CalendarX,
  CalendarCheck,
  CalendarClock,
  Home,
  Plus,
  Lightbulb
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { TaskCard } from "@/components/task/task-card"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval, addWeeks } from "date-fns"
import { tr } from "date-fns/locale"

export function DashboardOverview() {
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

  // Motivasyon sözleri listesi
  const motivationalQuotes = [
    { quote: "Büyük işler yapabilmek için tutkulu olmak yeterli değildir, aynı zamanda disiplinli de olmak gerekir.", author: "Benjamin Franklin" },
    { quote: "Başarı, küçük çabaların günden güne tekrar edilmesiyle elde edilir.", author: "Robert Collier" },
    { quote: "Hedefinize odaklanın ve her gün ona doğru küçük bir adım atın.", author: "Jack Canfield" },
    { quote: "Zaman yönetimi aslında dikkat yönetimidir.", author: "Dan Kennedy" },
    { quote: "Üretkenlik, meşgul olmak değil, doğru şeyleri yapmaktır.", author: "Tim Ferriss" },
    { quote: "Mükemmel bir plan bugün, kusursuz bir plan yarından iyidir.", author: "George S. Patton" },
    { quote: "Önceliklerinizi belirleyin ve onlara göre hareket edin.", author: "Stephen Covey" },
    { quote: "Her büyük başarı, küçük görevlerin birikiminden doğar.", author: "Peter Drucker" },
    { quote: "Odaklanma, hayır demeyi öğrenmektir.", author: "Steve Jobs" },
    { quote: "İyi organize olmak, zamanı yönetmek değil, enerjinizi yönetmektir.", author: "David Allen" },
    { quote: "Başarı, hazırlık ile fırsatın buluştuğu andır.", author: "Seneca" },
    { quote: "Hedeflerinizi yazın. Yazılmayan hedefler sadece dilektir.", author: "Antoine de Saint-Exupéry" },
    { quote: "Küçük ve sürekli gelişmeler, büyük sonuçlar doğurur.", author: "Kaizen Felsefesi" },
    { quote: "Zamanınızı kontrol edin, hayatınızı kontrol edin.", author: "Alan Lakein" },
    { quote: "Mükemmellik bir hedef değil, sürekli gelişim sürecidir.", author: "Tony Robbins" }
  ]

  // Her render'da farklı bir söz seç
  const todaysQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)
    return motivationalQuotes[randomIndex]
  }, [])

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProjects()
    ]).catch(error => {
      console.error('Failed to fetch dashboard data:', error)
    })
  }, [fetchTasks, fetchProjects])

  // Task handlers
  const handleDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ id: taskId, title: task.title, subTaskCount })
      setIsTaskDeleteDialogOpen(true)
    }
  }, [tasks])

  const handleEditTask = useCallback((task: any) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }, [])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskToCopy = tasks.find(t => t.id === taskId)
    if (taskToCopy) {
      setTaskToClone({
        id: taskId,
        title: taskToCopy.title,
        projectId: taskToCopy.projectId,
        sectionId: taskToCopy.sectionId
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
        sectionId: taskToMoveItem.sectionId
      })
      setIsTaskMoveModalOpen(true)
    }
  }, [tasks])

  const handleAddSubTask = useCallback((parentTaskId: string) => {
    const parentTask = tasks.find(t => t.id === parentTaskId)
    const project = parentTask ? projects.find(p => p.id === parentTask.projectId) : null
    
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
        // Revert optimistic updates if needed
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
        // Revert optimistic updates if needed
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }, [moveTask, fetchTasks])

  // Canlı istatistikler hesaplama
  const stats = useMemo(() => {
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')

    // Temel sayılar
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.completed).length
    const pendingTasks = tasks.filter(task => !task.completed).length
    const totalProjects = projects.length

    // Bugün sona erecek görevler
    const tasksDueToday = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      const taskDueDate = new Date(task.dueDate)
      const taskDateStr = taskDueDate.getFullYear() + '-' + 
                         String(taskDueDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(taskDueDate.getDate()).padStart(2, '0')
      return taskDateStr === todayStr
    })

    // Tarihi geçmiş görevler
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return dueDate < todayMidnight
    })

    // Yaklaşan görevler (bu hafta ve sonraki hafta)
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }) // Pazartesi başlangıç
    const nextWeekEnd = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
    
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      const dueDate = new Date(task.dueDate)
      return isWithinInterval(dueDate, { start: thisWeekStart, end: nextWeekEnd }) && 
             !isToday(dueDate) && dueDate >= today
    })

    // Öncelik dağılımı
    const priorityStats = {
      CRITICAL: tasks.filter(task => !task.completed && task.priority === 'CRITICAL').length,
      HIGH: tasks.filter(task => !task.completed && task.priority === 'HIGH').length,
      MEDIUM: tasks.filter(task => !task.completed && task.priority === 'MEDIUM').length,
      LOW: tasks.filter(task => !task.completed && task.priority === 'LOW').length,
    }

    // Tamamlanma oranı
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalProjects,
      tasksDueToday,
      overdueTasks,
      upcomingTasks,
      priorityStats,
      completionRate
    }
  }, [tasks, projects])

  const mainStats = [
    {
      title: "Toplam Proje",
      value: stats.totalProjects.toString(),
      description: "Aktif projeler",
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-primary/10 dark:bg-primary/5"
    },
    {
      title: "Toplam Görev",
      value: stats.totalTasks.toString(),
      description: "Tüm görevler",
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-accent/10 dark:bg-accent/5"
    },
    {
      title: "Tamamlanan",
      value: stats.completedTasks.toString(),
      description: `%${stats.completionRate} tamamlandı`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-secondary/20 dark:bg-secondary/10"
    },
    {
      title: "Bekleyen",
      value: stats.pendingTasks.toString(),
      description: "Devam eden görevler",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-destructive/10 dark:bg-destructive/5"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Today-style design */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Home className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Anasayfa
            </h1>
            <p className="text-muted-foreground">
              Proje ve görevlerinizin genel görünümü
            </p>
          </div>
        </div>

        {/* New Task Button */}
        <Button 
          onClick={() => setIsTaskModalOpen(true)}
          className="px-6 h-12 text-base"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Görev
        </Button>
      </div>

      {/* Minimal Stats Cards */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
        {mainStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded ${stat.bgColor}`}>
                  <stat.icon className={`h-3 w-3 ${stat.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Priority Distribution */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-primary/10 dark:bg-primary/5">
                <BarChart3 className="h-3 w-3 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl font-bold">
                  {stats.priorityStats.CRITICAL + stats.priorityStats.HIGH}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Yüksek Öncelik
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Quote Card - Ultra Compact */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-gradient-to-r from-indigo-500 to-purple-500 flex-shrink-0">
              <Lightbulb className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <blockquote className="text-xs font-medium text-indigo-900 dark:text-indigo-100 leading-tight line-clamp-1">
                "{todaysQuote.quote}" — {todaysQuote.author}
              </blockquote>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists - Horizontal Layout */}
      <div className="space-y-6">
        {/* Overdue Tasks */}
        {stats.overdueTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-md bg-destructive/20 flex items-center justify-center shadow-sm">
                  <CalendarX className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-destructive">
                    Süresi Geçmiş Görevler
                  </h2>
                  <p className="text-xs text-destructive/70">
                    Acil eylem gerekli
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  href="/overdue" 
                  className="text-xs font-medium text-destructive hover:text-destructive/80"
                >
                  Tümünü Gör →
                </Link>
                <div className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold min-w-[24px] text-center">
                  {stats.overdueTasks.length}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {stats.overdueTasks.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={handleDeleteTask}
                  onPin={toggleTaskPin}
                  onCopy={handleCopyTask}
                  onMove={handleMoveTaskModal}
                  onAddSubTask={handleAddSubTask}
                  onUpdateTags={updateTaskTags}
                  onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                  onUpdateReminders={updateTaskReminders}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today's Tasks - Always Show */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-destructive/10 dark:bg-destructive/5 border border-destructive/20 dark:border-destructive/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-md bg-destructive/20 dark:bg-destructive/10 flex items-center justify-center shadow-sm">
                <CalendarCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Bugün Bitiyor
                </h2>
                <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                  {stats.tasksDueToday.length > 0 ? "Bugün tamamlanmalı" : "Bugün bekleyen görev yok"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link 
                href="/today" 
                className="text-xs font-medium text-orange-600 hover:text-orange-500"
              >
                Tümünü Gör →
              </Link>
              <div className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold min-w-[24px] text-center">
                {stats.tasksDueToday.length}
              </div>
            </div>
          </div>
          
          {stats.tasksDueToday.length > 0 ? (
            <div className="space-y-3">
              {stats.tasksDueToday.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={handleDeleteTask}
                  onPin={toggleTaskPin}
                  onCopy={handleCopyTask}
                  onMove={handleMoveTaskModal}
                  onAddSubTask={handleAddSubTask}
                  onUpdateTags={updateTaskTags}
                  onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                  onUpdateReminders={updateTaskReminders}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-orange-300" />
              <p className="text-sm font-medium">Bugün için bekleyen görev yok</p>
              <p className="text-xs mt-1">Harika! Bugün için tüm görevlerin tamamlandı 🎉</p>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        {stats.upcomingTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-md bg-primary/20 dark:bg-primary/10 flex items-center justify-center shadow-sm">
                  <CalendarClock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Yaklaşan Görevler
                  </h2>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    Bu hafta ve sonraki hafta
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link 
                  href="/thisweek" 
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Tümünü Gör →
                </Link>
                <div className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold min-w-[24px] text-center">
                  {stats.upcomingTasks.length}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {stats.upcomingTasks.slice(0, 4).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                  onUpdate={updateTask}
                  onDelete={handleDeleteTask}
                  onPin={toggleTaskPin}
                  onCopy={handleCopyTask}
                  onMove={handleMoveTaskModal}
                  onAddSubTask={handleAddSubTask}
                  onUpdateTags={updateTaskTags}
                  onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                  onUpdateReminders={updateTaskReminders}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </div>
        )}
      </div>

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
            if (taskModalContext.parentTaskId) {
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