"use client"

import { cn } from "@/lib/utils"
import { ROUTES, THEME } from "@/lib/constants"
import { Plus, FolderKanban, Search, Moon, Sun, User, LogOut, PanelLeftClose, PanelLeft, CalendarX, Info, Palette, Eye, EyeOff, Settings, RefreshCw, Zap, Lightbulb, X, Minimize2 } from "lucide-react"
import { BsPin, BsFillPinFill } from "react-icons/bs"
import { RiCalendarScheduleLine, RiCalendarScheduleFill } from "react-icons/ri"
import { PiTagSimpleBold, PiTagSimpleFill } from "react-icons/pi"
import { FaRegStar, FaStar, FaRegCheckCircle, FaCheckCircle } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    color: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50", 
    activeColor: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/70 dark:to-teal-900/70 text-emerald-800 dark:text-emerald-200 border-emerald-300/70 dark:border-emerald-700/70 shadow-lg shadow-emerald-500/10", 
    href: ROUTES.TODAY 
  },
  { 
    name: "Bu Hafta", 
    count: 3, 
    icon: RiCalendarScheduleLine, 
    activeIcon: RiCalendarScheduleFill, 
    color: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50", 
    activeColor: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/70 dark:to-purple-900/70 text-violet-800 dark:text-violet-200 border-violet-300/70 dark:border-violet-700/70 shadow-lg shadow-violet-500/10", 
    href: ROUTES.SCHEDULED 
  },
  { 
    name: "Tamamlandı", 
    count: null, 
    icon: FaRegCheckCircle, 
    activeIcon: FaCheckCircle, 
    color: "bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/50 dark:to-lime-950/50 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/50", 
    activeColor: "bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/70 dark:to-lime-900/70 text-green-800 dark:text-green-200 border-green-300/70 dark:border-green-700/70 shadow-lg shadow-green-500/10", 
    href: ROUTES.COMPLETED 
  },
  { 
    name: "Gecikmiş", 
    count: null, 
    icon: CalendarX, 
    activeIcon: CalendarX, 
    color: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-800/50", 
    activeColor: "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/70 dark:to-rose-900/70 text-red-800 dark:text-red-200 border-red-300/70 dark:border-red-700/70 shadow-lg shadow-red-500/10", 
    href: ROUTES.OVERDUE 
  },
  { 
    name: "Etiketler", 
    count: 2, 
    icon: PiTagSimpleBold, 
    activeIcon: PiTagSimpleFill, 
    color: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50", 
    activeColor: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/70 dark:to-yellow-900/70 text-amber-800 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/70 shadow-lg shadow-amber-500/10", 
    href: ROUTES.TAGS 
  },
  { 
    name: "Pano", 
    count: 2, 
    icon: BsPin, 
    activeIcon: BsFillPinFill, 
    color: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50", 
    activeColor: "bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/70 dark:to-pink-900/70 text-rose-800 dark:text-rose-200 border-rose-300/70 dark:border-rose-700/70 shadow-lg shadow-rose-500/10", 
    href: ROUTES.BOARD 
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
  const [showCompletedProjects, setShowCompletedProjects] = useState(true)
  const [isInspirationExpanded, setIsInspirationExpanded] = useState(true)
  const { projects, fetchProjects, createProject } = useProjectStore()
  const { tags, fetchTags } = useTagStore()
  const { getPinnedTasks, getPendingTasksCount, fetchTasks, tasks, getProjectCompletionPercentage, getTasksDueToday, getTotalCompletedTasksCount, getCurrentWeekTasksCount, getOverdueTasks } = useTaskStore()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const { isConnected: googleCalendarConnected, lastSyncAt, isSyncing, setLastSyncAt, setIsSyncing, updateSyncStatus } = useGoogleCalendarStore()

  // İlham kartının durumunu localStorage'dan yükle
  useEffect(() => {
    const savedState = localStorage.getItem('inspirationExpanded')
    if (savedState !== null) {
      setIsInspirationExpanded(JSON.parse(savedState))
    }
  }, [])

  // İlham kartının durumunu localStorage'a kaydet
  const toggleInspirationExpanded = () => {
    const newState = !isInspirationExpanded
    setIsInspirationExpanded(newState)
    localStorage.setItem('inspirationExpanded', JSON.stringify(newState))
  }

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
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    // Hiç görev yoksa tamamlandı sayılmaz
    if (projectTasks.length === 0) return false
    
    // En az 1 görev var ve tüm görevler tamamlanmışsa proje tamamlandı
    return projectTasks.every(task => task.completed)
  }, [tasks])

  // Projeleri sırala ve filtrele
  const sortedProjects = useMemo(() => {
    let filteredProjects = [...projects]
    
    // Tamamlanan projeleri gizle seçeneği aktifse filtrele
    if (!showCompletedProjects) {
      filteredProjects = filteredProjects.filter(project => !isProjectCompleted(project.id))
    }
    
    return filteredProjects.sort((a, b) => {
      // Özel proje sıralaması: Planner Takvimi, Hızlı Notlar, diğerleri
      if (a.name === "Planner Takvimi") return -1
      if (b.name === "Planner Takvimi") return 1
      if (a.name === "Hızlı Notlar") return -1
      if (b.name === "Hızlı Notlar") return 1
      // Diğer projeler alfabetik sırada
      return a.name.localeCompare(b.name, 'tr')
    })
  }, [projects, showCompletedProjects, isProjectCompleted])

  // Dinamik sayıları hesapla
  const getDynamicCount = (itemName: string) => {
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
      default:
        return null
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
          {/* Add Task and Search Buttons */}
          <div className="px-4 pt-2 pb-3">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1 px-3 py-2 font-medium"
                    onClick={() => setIsTaskModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
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
                    className="px-2"
                    onClick={() => setIsQuickTaskModalOpen(true)}
                  >
                    <Zap className="h-4 w-4" />
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
                    className="px-2"
                    onClick={() => onOpenSearch?.()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hızlı Arama</p>
                  <p className="text-xs text-muted-foreground">Ctrl+S</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="p-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              {cardItems.map((item) => {
                const dynamicCount = getDynamicCount(item.name)
                const displayCount = dynamicCount !== null ? dynamicCount : item.count
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5",
                      pathname === item.href ? item.activeColor : item.color
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {pathname === item.href ? (
                        <item.activeIcon className="h-5 w-5" />
                      ) : (
                        <item.icon className="h-5 w-5" />
                      )}
                      {displayCount !== null && (
                        <span className="text-sm font-medium">{displayCount}</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-medium">{item.name}</div>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Projects Section */}
          <div className="px-4 pb-2 pt-4">
            <div className="flex items-center justify-between mb-3 px-2 border-b border-gray-300 dark:border-gray-600 pb-2 text-primary">
              <h3 className="text-sm font-medium ">Projeler</h3>
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-4 w-4 cursor-pointer hover:opacity-70 transition-opacity"
                      onClick={() => setShowCompletedProjects(!showCompletedProjects)}
                    >
                      {showCompletedProjects ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showCompletedProjects ? "Tamamlanan projeleri gizle" : "Tamamlanan projeleri göster"}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Plus 
                      className="h-4 w-4 cursor-pointer hover:opacity-70 transition-opacity" 
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
            <div className="space-y-1 pb-2">
              {sortedProjects.map((project) => {
                // TaskStore'dan bekleyen görev sayısını al
                const pendingCount = getPendingTasksCount(project.id)
                // API'den gelen sayı
                const apiCount = project._count?.tasks || 0
                // Eğer taskStore'da görevler yüklendiyse pending sayısını kullan, yoksa API'den gelen sayıyı kullan
                const displayCount = tasks.length > 0 ? pendingCount : apiCount
                
                const completionPercentage = getProjectCompletionPercentage(project.id)
                
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center space-x-2">
                      {project.emoji ? (
                        <span className="text-sm">{project.emoji}</span>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">{project.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{displayCount}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <CircularProgress 
                              percentage={completionPercentage} 
                              size={16} 
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
            {sortedProjects.map((project) => {
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
      
      {/* Günün İlhamı - Sadece açık sidebar'da görünsün */}
      {isOpen && (
        <div className="px-4 pb-4">
          {isInspirationExpanded ? (
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 group-hover:from-indigo-500/15 group-hover:via-purple-500/15 group-hover:to-pink-500/15 transition-all duration-300" />
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-200/20 to-transparent rounded-bl-full" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full group-hover:scale-110 transition-transform duration-300" />
              
              {/* Floating Particles Effect */}
              <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-indigo-400/40 rounded-full animate-pulse" />
              <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-pulse delay-300" />
              <div className="absolute bottom-1/3 left-2/3 w-0.5 h-0.5 bg-pink-400/40 rounded-full animate-pulse delay-700" />
              
              {/* Toggle Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleInspirationExpanded}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm z-10"
                  >
                    <Minimize2 className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Küçült</p>
                </TooltipContent>
              </Tooltip>
              
              <CardContent className="relative p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-sm opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                      <div className="relative p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <Lightbulb className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Günün İlhamı
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Motivasyon & İlham
                      </p>
                    </div>
                  </div>
                  
                  {/* Quote Content - Compact */}
                  <div className="relative">
                    <div className="absolute -left-1 -top-1 text-lg text-indigo-300/30 dark:text-indigo-600/30 font-serif">
                      "
                    </div>
                    <div className="absolute -right-1 -bottom-1 text-lg text-purple-300/30 dark:text-purple-600/30 font-serif rotate-180">
                      "
                    </div>
                    <blockquote className="relative text-xs font-medium text-gray-700 dark:text-gray-200 leading-relaxed text-center px-2 py-1">
                      Her bir tık, hedefinize bir adım daha yaklaşmanız demektir. Ağaçkakan gibi kararlı olun.
                    </blockquote>
                  </div>
                  
                  {/* Author - Compact */}
                  <div className="flex items-center justify-center space-x-1 pt-1">
                    <div className="w-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
                    <cite className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 not-italic">
                      Planner Ağaçkakanı
                    </cite>
                    <div className="w-4 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Minimal Icon Button */
            <div className="flex justify-start">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleInspirationExpanded}
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Lightbulb className="h-4 w-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Günün İlhamı - Genişlet</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
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
          /* Collapsed state - vertical icon stack */
          <div className="flex flex-col items-center space-y-2">
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
              <TooltipContent side="right">
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
              <TooltipContent side="right">
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
              <TooltipContent side="right">
                <p>Renk Teması</p>
              </TooltipContent>
            </Tooltip>

            {/* Google Calendar Sync Button - Collapsed */}
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
                <TooltipContent side="right">
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
              <TooltipContent side="right">
                <p>Kullanıcı Menüsü</p>
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
      </div>
    </TooltipProvider>
  )
}