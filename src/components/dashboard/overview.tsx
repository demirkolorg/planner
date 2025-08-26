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
  Lightbulb,
  Info
} from "lucide-react"
import { BRAND_SLOGANS } from "@/lib/constants"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { TaskCard } from "@/components/task/task-card"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { KeyboardShortcutsModal } from "@/components/modals/keyboard-shortcuts-modal"
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
    addSubTask,
    cloneTask,
    moveTask,
  } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()
  
  // Rastgele slogan seç (hydration sorunu için client-side)
  const [randomSlogan, setRandomSlogan] = useState("Hedefe Tık Tık.")
  
  useEffect(() => {
    // Client-side'da rastgele slogan seç
    const randomIndex = Math.floor(Math.random() * BRAND_SLOGANS.length)
    setRandomSlogan(BRAND_SLOGANS[randomIndex])
  }, [])

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
  const [isKeyboardShortcutsModalOpen, setIsKeyboardShortcutsModalOpen] = useState(false)

  // AI'dan motivasyon sözü çekme (cache'lenmis)
  const [todaysQuote, setTodaysQuote] = useState({
    quote: "Başarı, günlük rutinlerde saklıdır. Her gün biraz ilerlemeniz, büyük değişimlere yol açar.",
    author: "AI İlham Kaynağı",
    category: "productivity"
  })
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)

  // Günde bir kez motivasyon sözü çek (localStorage cache ile)
  const fetchMotivationalQuote = useCallback(async () => {
    const today = new Date().toDateString()
    const cachedQuote = localStorage.getItem('dailyQuote')
    const cachedDate = localStorage.getItem('dailyQuoteDate')
    
    // Eğer bugün için cache'lenmiş söz varsa, API'ye gitme
    if (cachedQuote && cachedDate === today) {
      try {
        setTodaysQuote(JSON.parse(cachedQuote))
        return
      } catch (error) {
        console.error('Cached quote parse error:', error)
      }
    }

    // Sadece cache yoksa API'ye git
    setIsQuoteLoading(true)
    try {
      const response = await fetch('/api/motivational-quote')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTodaysQuote(result.data)
          // Yeni söz'ü cache'le
          localStorage.setItem('dailyQuote', JSON.stringify(result.data))
          localStorage.setItem('dailyQuoteDate', today)
        }
      }
    } catch (error) {
      console.error('Motivasyon sözü çekerken hata:', error)
      // Hata durumunda varsayılan söz kalsın
    } finally {
      setIsQuoteLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProjects(),
      fetchMotivationalQuote()
    ]).catch(error => {
      console.error('Failed to fetch dashboard data:', error)
    })
  }, [fetchTasks, fetchProjects, fetchMotivationalQuote])

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

    // Zaman aralıkları
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    const thisWeek = startOfWeek(today, { weekStartsOn: 1 })

    // Temel sayılar
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.completed).length
    const pendingTasks = tasks.filter(task => !task.completed).length
    const totalProjects = projects.length

    // Geçmiş verilerle karşılaştırma
    const tasksCreatedThisWeek = tasks.filter(task => {
      if (!task.createdAt) return false
      return new Date(task.createdAt) >= thisWeek
    }).length

    const tasksCompletedThisWeek = tasks.filter(task => {
      if (!task.updatedAt || !task.completed) return false
      return new Date(task.updatedAt) >= thisWeek
    }).length

    const tasksCompletedLastWeek = tasks.filter(task => {
      if (!task.updatedAt || !task.completed) return false
      const updatedDate = new Date(task.updatedAt)
      return updatedDate >= lastWeek && updatedDate < thisWeek
    }).length

    // Yüzde değişimleri hesapla
    const weeklyTaskGrowth = tasksCompletedLastWeek > 0 
      ? Math.round(((tasksCompletedThisWeek - tasksCompletedLastWeek) / tasksCompletedLastWeek) * 100)
      : tasksCompletedThisWeek > 0 ? 100 : 0

    const projectGrowth = Math.max(5, Math.min(15, Math.round(Math.random() * 10 + 5))) // 5-15% arası

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
      todayTasks: tasksDueToday.length,
      thisWeekTasks: upcomingTasks.length,
      tasksDueToday,
      overdueTasks,
      upcomingTasks,
      priorityStats,
      completionRate,
      weeklyTaskGrowth,
      projectGrowth,
      tasksCompletedThisWeek,
      tasksCreatedThisWeek
    }
  }, [tasks, projects])

  const mainStats = [
    {
      title: "Toplam Proje",
      value: stats.totalProjects.toString(),
      description: "Aktif projeler",
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-primary/10 dark:bg-primary/5",
      growth: stats.projectGrowth,
      growthPeriod: "bu ay"
    },
    {
      title: "Toplam Görev",
      value: stats.totalTasks.toString(),
      description: "Tüm görevler",
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-accent/10 dark:bg-accent/5",
      growth: stats.tasksCreatedThisWeek > 0 ? Math.round((stats.tasksCreatedThisWeek / Math.max(stats.totalTasks - stats.tasksCreatedThisWeek, 1)) * 100) : 0,
      growthPeriod: "bu hafta"
    },
    {
      title: "Tamamlanan",
      value: stats.completedTasks.toString(),
      description: `%${stats.completionRate} tamamlandı`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-secondary/20 dark:bg-secondary/10",
      growth: stats.weeklyTaskGrowth,
      growthPeriod: "bu hafta"
    },
    {
      title: "Bekleyen",
      value: stats.pendingTasks.toString(),
      description: "Devam eden görevler",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-destructive/10 dark:bg-destructive/5",
      growth: -Math.round((stats.tasksCompletedThisWeek / Math.max(stats.pendingTasks + stats.tasksCompletedThisWeek, 1)) * 100),
      growthPeriod: "bu hafta"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Today-style design */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Home className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Anasayfa
            </h1>
            <p className="text-muted-foreground font-medium">
              {randomSlogan}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Keyboard Shortcuts Button */}
          <Button 
            variant="ghost"
            onClick={() => setIsKeyboardShortcutsModalOpen(true)}
            className="h-12 px-4"
          >
            <Info className="h-4 w-4 mr-2" />
            Kısayollar
          </Button>
          
          {/* New Task Button */}
          <Button 
            onClick={() => setIsTaskModalOpen(true)}
            className="px-6 h-12 text-base"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Görev
          </Button>
        </div>
      </div>

      {/* Modern Stats Cards - Single Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Ana İstatistik Kartları */}
        {mainStats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border border-border transition-all duration-300 group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-10 group-hover:opacity-15 transition-opacity duration-300`} />
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-3xl" />
            <div className={`absolute -top-2 -right-2 w-8 h-8 ${stat.bgColor} rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
            <div className={`absolute -bottom-1 -left-1 w-6 h-6 ${stat.bgColor} rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-300`} />
            
            <CardContent className="relative p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex p-2 rounded-xl ${stat.bgColor} transition-colors duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.growth >= 0 ? '+' : ''}{stat.growth}%
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.growthPeriod}</div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight mb-1 group-hover:text-primary transition-colors duration-300">
                    {stat.value}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                </div>
                {/* Progress Indicator */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">İlerleme</span>
                    <span className="font-medium">{Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-1.5">
                    <div className={`bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-600', '-400')} to-${stat.color.replace('text-', '').replace('-600', '-600')} h-1.5 rounded-full transition-all duration-500`} style={{width: `${Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)}%`}} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Yüksek Öncelik Kartı */}
        <Card className="relative overflow-hidden border border-border transition-all duration-300 group hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 group-hover:from-purple-500/15 group-hover:to-indigo-500/15 transition-all duration-300" />
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-bl-3xl" />  
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors duration-300" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-indigo-500/15 rounded-full group-hover:bg-indigo-500/25 transition-colors duration-300" />
          
          <CardContent className="relative p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20 transition-colors duration-300">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${(stats.priorityStats.CRITICAL + stats.priorityStats.HIGH) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {stats.priorityStats.CRITICAL + stats.priorityStats.HIGH > 0 ? '+' : ''}{stats.priorityStats.CRITICAL + stats.priorityStats.HIGH > 3 ? Math.round(stats.priorityStats.CRITICAL * 0.5) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">bu hafta</div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight mb-1 group-hover:text-purple-600 transition-colors duration-300">
                  {stats.priorityStats.CRITICAL + stats.priorityStats.HIGH}
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Yüksek Öncelik
                </p>
              </div>
              {/* Priority Breakdown */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-red-600 font-medium">{stats.priorityStats.CRITICAL} Kritik</span>
                  <span className="text-orange-600 font-medium">{stats.priorityStats.HIGH} Yüksek</span>
                </div>
                <div className="flex space-x-1">
                  <div className="flex-1 bg-red-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-red-400 to-red-600 h-1.5 rounded-full" style={{width: '70%'}} />
                  </div>
                  <div className="flex-1 bg-orange-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-1.5 rounded-full" style={{width: '50%'}} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İlerleme Kartı */}
        <Card className="relative overflow-hidden border border-border transition-all duration-300 group hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 group-hover:from-green-500/15 group-hover:to-emerald-500/15 transition-all duration-300" />
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-200/20 to-transparent rounded-bl-3xl" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors duration-300" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-emerald-500/15 rounded-full group-hover:bg-emerald-500/25 transition-colors duration-300" />
          
          <CardContent className="relative p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="inline-flex p-2 rounded-xl bg-green-100 dark:bg-green-900/20 transition-colors duration-300">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${stats.weeklyTaskGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.weeklyTaskGrowth >= 0 ? '+' : ''}{stats.weeklyTaskGrowth}%
                  </div>
                  <div className="text-xs text-muted-foreground">bu hafta</div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight mb-1 text-green-600 dark:text-green-400 group-hover:text-green-700 transition-colors duration-300">
                  {Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)}%
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Tamamlanma Oranı
                </p>
              </div>
              {/* Circular Progress */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Bu ay hedef</span>
                  <span className="font-medium text-green-600">{Math.min(100, Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100) + 20)}%</span>
                </div>
                <div className="relative w-full bg-secondary/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000 group-hover:to-green-600"
                    style={{ width: `${Math.round((stats.completedTasks / Math.max(stats.totalTasks, 1)) * 100)}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Task Lists - Horizontal Layout */}
      <div className="space-y-6">
        {/* Overdue Tasks */}
        {stats.overdueTasks.length > 0 && (
          <div className="space-y-3">
            <Link href="/overdue" className="block">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 transition-colors duration-200 cursor-pointer group">
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
                <div className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold min-w-[24px] text-center">
                  {stats.overdueTasks.length}
                </div>
              </div>
            </Link>
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
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today's Tasks - Always Show */}
        <div className="space-y-3">
          <Link href="/today" className="block">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-destructive/10 dark:bg-destructive/5 border border-destructive/20 dark:border-destructive/10 hover:bg-destructive/15 transition-colors duration-200 cursor-pointer group">
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
              <div className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold min-w-[24px] text-center">
                {stats.tasksDueToday.length}
              </div>
            </div>
          </Link>
          
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
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-orange-300" />
              <p className="text-sm font-medium">Bugün için bekleyen görev yok</p>
              <p className="text-xs mt-1">Harika! Ritminizi korudunuz. Tık tık hedefe ulaşın! 🎯</p>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        {stats.upcomingTasks.length > 0 && (
          <div className="space-y-3">
            <Link href="/thisweek" className="block">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/5 border border-primary/20 dark:border-primary/10 hover:bg-primary/15 transition-colors duration-200 cursor-pointer group">
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
                <div className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold min-w-[24px] text-center">
                  {stats.upcomingTasks.length}
                </div>
              </div>
            </Link>
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

      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsModalOpen}
        onClose={() => setIsKeyboardShortcutsModalOpen(false)}
      />
    </div>
  )
}