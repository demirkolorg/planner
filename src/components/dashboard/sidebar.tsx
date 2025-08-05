"use client"

import { cn } from "@/lib/utils"
import { ROUTES, THEME } from "@/lib/constants"
import { Plus, FolderKanban, Search, Moon, Sun, User, LogOut, PanelLeftClose, PanelLeft, CalendarX, Info, Palette, Settings, RefreshCw, Zap, Type, Folder, Calendar, FileText } from "lucide-react"
import { BsPin, BsFillPinFill } from "react-icons/bs"
import { RiCalendarScheduleLine, RiCalendarScheduleFill } from "react-icons/ri"
import { PiTagSimpleBold, PiTagSimpleFill } from "react-icons/pi"
import { FaRegStar, FaStar, FaRegCheckCircle, FaCheckCircle } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { useGoogleCalendarStore } from "@/store/googleCalendarStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { QuickTaskModal } from "@/components/modals/quick-task-modal"
import { ColorThemeModal } from "@/components/modals/color-theme-modal"
import { FontSizeModal } from "@/components/modals/font-size-modal"
import { isProtectedProject } from "@/lib/project-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CircularProgress } from "@/components/ui/circular-progress"
import { useRouter } from "next/navigation"

const cardItems = [
  { 
    name: "Bugün", 
    count: 1, 
    icon: FaRegStar, 
    activeIcon: FaStar, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/70 dark:to-teal-900/70 text-emerald-800 dark:text-emerald-200 border-emerald-300/70 dark:border-emerald-700/70 shadow-lg shadow-emerald-500/10", 
    href: ROUTES.TODAY 
  },
  { 
    name: "Bu Hafta", 
    count: 3, 
    icon: RiCalendarScheduleLine, 
    activeIcon: RiCalendarScheduleFill, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/70 dark:to-purple-900/70 text-violet-800 dark:text-violet-200 border-violet-300/70 dark:border-violet-700/70 shadow-lg shadow-violet-500/10", 
    href: ROUTES.SCHEDULED 
  },
  { 
    name: "Tamamlandı", 
    count: null, 
    icon: FaRegCheckCircle, 
    activeIcon: FaCheckCircle, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/70 dark:to-lime-900/70 text-green-800 dark:text-green-200 border-green-300/70 dark:border-green-700/70 shadow-lg shadow-green-500/10", 
    href: ROUTES.COMPLETED 
  },
  { 
    name: "Gecikmiş", 
    count: null, 
    icon: CalendarX, 
    activeIcon: CalendarX, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/70 dark:to-rose-900/70 text-red-800 dark:text-red-200 border-red-300/70 dark:border-red-700/70 shadow-lg shadow-red-500/10", 
    href: ROUTES.OVERDUE 
  },
  { 
    name: "Etiketler", 
    count: 2, 
    icon: PiTagSimpleBold, 
    activeIcon: PiTagSimpleFill, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/70 dark:to-yellow-900/70 text-amber-800 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/70 shadow-lg shadow-amber-500/10", 
    href: ROUTES.TAGS 
  },
  { 
    name: "Pano", 
    count: 2, 
    icon: BsPin, 
    activeIcon: BsFillPinFill, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/70 dark:to-pink-900/70 text-rose-800 dark:text-rose-200 border-rose-300/70 dark:border-rose-700/70 shadow-lg shadow-rose-500/10", 
    href: ROUTES.BOARD 
  },
  { 
    name: "Google Takvim", 
    count: null, 
    icon: Calendar, 
    activeIcon: Calendar, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/70 dark:to-teal-900/70 text-cyan-800 dark:text-cyan-200 border-cyan-300/70 dark:border-cyan-700/70 shadow-lg shadow-cyan-500/10", 
    href: "/calendar-tasks", 
    taskType: 'CALENDAR'
  },
  { 
    name: "Hızlı Notlar", 
    count: null, 
    icon: FileText, 
    activeIcon: FileText, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/70 dark:to-red-900/70 text-orange-800 dark:text-orange-200 border-orange-300/70 dark:border-orange-700/70 shadow-lg shadow-orange-500/10", 
    href: "/quick-notes", 
    taskType: 'QUICK_NOTE'
  },
  { 
    name: "Projeler", 
    count: null, 
    icon: Folder, 
    activeIcon: FolderKanban, 
    color: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700", 
    activeColor: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/70 dark:to-indigo-900/70 text-blue-800 dark:text-blue-200 border-blue-300/70 dark:border-blue-700/70 shadow-lg shadow-blue-500/10", 
    href: "/projects" 
  },
]


interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onOpenSearch?: () => void
}

export function DashboardSidebar({ isOpen, onToggle, onOpenSearch }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false)
  const [isColorThemeModalOpen, setIsColorThemeModalOpen] = useState(false)
  const [isFontSizeModalOpen, setIsFontSizeModalOpen] = useState(false)
  const { projects, fetchProjects, createProject } = useProjectStore()
  const { tags, fetchTags } = useTagStore()
  const { getPinnedTasks, getPendingTasksCount, fetchTasks, tasks, getProjectCompletionPercentage, getTasksDueToday, getTotalCompletedTasksCount, getCurrentWeekTasksCount, getOverdueTasks } = useTaskStore()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { isConnected: googleCalendarConnected, lastSyncAt, isSyncing, setLastSyncAt, setIsSyncing, updateSyncStatus } = useGoogleCalendarStore()


  useEffect(() => {
    Promise.all([
      fetchProjects(),
      fetchTags(),
      fetchTasks() // Tüm görevleri yükle
    ]).catch(error => {
      console.error('Failed to fetch sidebar data:', error)
    })

    // Google Calendar durumunu kontrol et
    updateSyncStatus()
  }, [fetchProjects, fetchTags, fetchTasks, updateSyncStatus])

  const handleCreateProject = async (name: string, emoji: string) => {
    try {
      const newProject = await createProject(name, emoji)
      // Proje detay sayfasına yönlendir
      router.push(`/projects/${newProject.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === THEME.DARK ? THEME.LIGHT : THEME.DARK)
  }

  const handleCreateTask = () => {
    // Task creation logic will be added later
  }

  // Google Calendar Sync
  const handleGoogleCalendarSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/google/sync/bidirectional', {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        const newSyncTime = new Date().toISOString()
        setLastSyncAt(newSyncTime)
        
        // Sidebar'daki verileri yenile
        await Promise.all([
          fetchTasks(),
          fetchProjects()
        ])
      }
    } catch (error) {
      console.error('Sync hatası:', error)
    }
    setIsSyncing(false)
  }

  // Proje tamamlanma kontrolü
  const isProjectCompleted = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    
    // Korumalı projeler hiçbir zaman tamamlandı olarak işaretlenemez
    if (project && isProtectedProject(project.name)) return false
    
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    // Hiç görev yoksa tamamlandı sayılmaz
    if (projectTasks.length === 0) return false
    
    // En az 1 görev var ve tüm görevler tamamlanmışsa proje tamamlandı
    return projectTasks.every(task => task.completed)
  }, [tasks, projects])

  // Sabitlenmiş projeleri filtrele ve sırala
  const pinnedProjects = useMemo(() => {
    let filteredProjects = [...projects]
    
    // Sadece sabitlenmiş projeleri göster
    filteredProjects = filteredProjects.filter(project => project.isPinned)
    
    // Alfabetik sıralama
    return filteredProjects.sort((a, b) => {
      return a.name.localeCompare(b.name, 'tr')
    })
  }, [projects])

  // Dinamik sayıları hesapla
  const getDynamicCount = (itemName: string, taskType?: string) => {
    switch (itemName) {
      case "Bugün":
        return getTasksDueToday().length
      case "Gecikmiş":
        return getOverdueTasks().length
      case "Bu Hafta":
        return getCurrentWeekTasksCount()
      case "Tamamlandı":
        return getTotalCompletedTasksCount()
      case "Etiketler":
        return tags.length
      case "Pano":
        return getPinnedTasks().length
      case "Projeler":
        return projects.length
      case "Google Takvim":
        // Calendar task'ları say
        return tasks.filter(task => task.taskType === 'CALENDAR' && !task.completed).length
      case "Hızlı Notlar":
        // Quick Note task'ları say
        return tasks.filter(task => task.taskType === 'QUICK_NOTE' && !task.completed).length
      default:
        return taskType ? tasks.filter(task => task.taskType === taskType && !task.completed).length : null
    }
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "flex h-full flex-col bg-sidebar transition-all duration-300 ease-in-out fixed left-0 top-0 p-2 z-10",
        isOpen ? "w-80" : "w-16"
      )}>
      <div className="flex h-14 items-center justify-between px-2 text-primary">
        {isOpen ? (
          <Link href={ROUTES.DASHBOARD} className="flex items-center pl-2 hover:opacity-80 transition-opacity">
            <Logo size={28} className="mr-3" />
            <h1 className="text-xl font-bold">Planner</h1>
          </Link>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={ROUTES.DASHBOARD} className="flex-1 flex items-center justify-center hover:opacity-80 transition-opacity">
                <Logo size={28} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Anasayfa</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onToggle}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Add Task and Search Buttons - Compact */}
          <div className="px-4 pt-2 pb-2">
            <div className="flex gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1 px-2 py-1.5 text-xs font-medium h-8"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Görev Ekle
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Yeni Görev Oluştur</p>
                  <p className="text-xs text-muted-foreground">Ctrl+J</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-1.5 h-8 w-8"
                    onClick={() => setIsQuickTaskModalOpen(true)}
                  >
                    <Zap className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hızlı Görev Ekleme</p>
                  <p className="text-xs text-muted-foreground">Ctrl+K</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-1.5 h-8 w-8"
                    onClick={() => onOpenSearch?.()}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hızlı Arama</p>
                  <p className="text-xs text-muted-foreground">Ctrl+S</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Navigation Cards - Compact Design */}
          <div className="p-4 pb-2">
            <div className="grid grid-cols-2 gap-2">
              {cardItems.map((item) => {
                const dynamicCount = getDynamicCount(item.name, (item as any).taskType)
                const displayCount = dynamicCount !== null ? dynamicCount : item.count
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "p-2 rounded-lg border transition-all duration-200 hover:shadow-sm hover:scale-[1.01]",
                      pathname === item.href ? item.activeColor : item.color
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {pathname === item.href ? (
                        <item.activeIcon className="h-4 w-4" />
                      ) : (
                        <item.icon className="h-4 w-4" />
                      )}
                      {displayCount !== null && (
                        <span className="text-xs font-semibold">{displayCount}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium leading-tight">{item.name}</div>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Projects Section - Compact */}
          <div className="px-4 pb-1 pt-2">
            <div className="flex items-center justify-between mb-2 px-2 border-b border-gray-300 dark:border-gray-600 pb-1.5 text-primary">
              <h3 className="text-xs font-medium uppercase tracking-wide">Sabitlenmiş Projeler</h3>
              <div className="flex items-center space-x-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Plus 
                      className="h-3.5 w-3.5 cursor-pointer hover:opacity-70 transition-opacity" 
                      onClick={() => setIsProjectModalOpen(true)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Yeni Proje Ekle</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          
          {/* Scrollable Projects List */}
          <div className="flex-1 px-4 overflow-y-auto">
            <div className="space-y-0.5 pb-2">
              {pinnedProjects.map((project) => {
                // Sadece bekleyen görev sayısını göster
                const pendingCount = getPendingTasksCount(project.id)
                
                const completionPercentage = getProjectCompletionPercentage(project.id)
                
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {project.emoji ? (
                        <span className="text-sm flex-shrink-0">{project.emoji}</span>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{project.name}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{pendingCount}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <CircularProgress 
                              percentage={completionPercentage} 
                              size={14} 
                              strokeWidth={2} 
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>%{completionPercentage} tamamlandı</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Navigation Icons */}
      {!isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Add Task and Search Buttons - Collapsed */}
          <div className="p-2 space-y-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="w-full h-9"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Yeni Görev Oluştur</p>
                <p className="text-xs text-muted-foreground">Ctrl+J</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-full h-9"
                  onClick={() => setIsQuickTaskModalOpen(true)}
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Hızlı Görev Ekleme</p>
                <p className="text-xs text-muted-foreground">Ctrl+K</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9"
                  onClick={() => onOpenSearch?.()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Hızlı Arama</p>
                <p className="text-xs text-muted-foreground">Ctrl+S</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="mx-2 border-t border-gray-200 dark:border-sidebar-border" />

          {/* Navigation Icons */}
          <div className="p-2 space-y-2">
            {cardItems.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-accent",
                      pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pathname === item.href ? (
                      <item.activeIcon className="h-5 w-5" />
                    ) : (
                      <item.icon className="h-5 w-5" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-2 border-t border-gray-200 dark:border-sidebar-border" />

          {/* Collapsed Projects */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto">
            {pinnedProjects.map((project) => {
              const completionPercentage = getProjectCompletionPercentage(project.id)
              
              return (
                <Tooltip key={project.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/projects/${project.id}`}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-accent",
                        pathname === `/projects/${project.id}` ? "bg-gray-200 dark:bg-accent text-gray-800 dark:text-accent-foreground" : "text-gray-600 dark:text-muted-foreground hover:text-gray-800 dark:hover:text-foreground"
                      )}
                    >
                      {project.emoji ? (
                        <span className="text-lg">{project.emoji}</span>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{project.name}</p>
                    <p className="text-xs text-muted-foreground">%{completionPercentage} tamamlandı</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      )}
      
      
      {/* Bottom Actions Section */}
      <div className="p-2 space-y-2">
        {isOpen ? (
          <>
            {/* Action Buttons Row */}
            <div className="flex items-center justify-center space-x-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-9 w-9"
                  >
                    <Link href="/guide">
                      <Info className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Kullanım Kılavuzu</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9"
                  >
                    {theme === THEME.DARK ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{theme === THEME.DARK ? "Aydınlık Tema" : "Karanlık Tema"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsColorThemeModalOpen(true)}
                    className="h-9 w-9"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Renk Teması</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFontSizeModalOpen(true)}
                    className="h-9 w-9"
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Font Boyutu</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Google Calendar Sync Button */}
              {googleCalendarConnected && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleGoogleCalendarSync}
                      disabled={isSyncing}
                      className="h-9 w-9"
                    >
                      <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">Google Calendar Sync</p>
                      {lastSyncAt ? (
                        <p className="text-xs text-muted-foreground">
                          Son sync: {new Date(lastSyncAt).toLocaleString('tr-TR')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Henüz sync yapılmamış</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 rounded-full">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Ayarlar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Kullanıcı Menüsü</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        ) : (
          /* Collapsed state - single settings dropdown */
          <div className="flex flex-col items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="right">
                    {/* Kullanıcı Bilgisi */}
                    <div className="flex items-center justify-start gap-2 p-2 border-b">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    
                    {/* Kılavuz */}
                    <DropdownMenuItem asChild>
                      <Link href="/guide" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Kullanım Kılavuzu
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Tema Değiştir */}
                    <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2">
                      {theme === THEME.DARK ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {theme === THEME.DARK ? "Aydınlık Tema" : "Karanlık Tema"}
                    </DropdownMenuItem>
                    
                    {/* Renk Teması */}
                    <DropdownMenuItem onClick={() => setIsColorThemeModalOpen(true)} className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Renk Teması
                    </DropdownMenuItem>
                    
                    {/* Font Boyutu */}
                    <DropdownMenuItem onClick={() => setIsFontSizeModalOpen(true)} className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Font Boyutu
                    </DropdownMenuItem>
                    
                    {/* Google Calendar Sync */}
                    {googleCalendarConnected && (
                      <DropdownMenuItem 
                        onClick={handleGoogleCalendarSync} 
                        disabled={isSyncing} 
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                        Google Calendar Sync
                        {lastSyncAt && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(lastSyncAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    {/* Profil */}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Ayarlar */}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Ayarlar
                      </Link>
                    </DropdownMenuItem>
                    
                    {/* Çıkış */}
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Ayarlar & Menü</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
      />
      
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
      />
      
      <ColorThemeModal
        isOpen={isColorThemeModalOpen}
        onClose={() => setIsColorThemeModalOpen(false)}
      />
      
      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
      />
      
      <FontSizeModal
        isOpen={isFontSizeModalOpen}
        onClose={() => setIsFontSizeModalOpen(false)}
      />
      </div>
    </TooltipProvider>
  )
}