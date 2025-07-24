"use client"

import { cn } from "@/lib/utils"
import { ROUTES, THEME } from "@/lib/constants"
import { Plus, FolderKanban, Search, Moon, Sun, Settings, User, LogOut, PanelLeftClose, PanelLeft } from "lucide-react"
import { MdOutlineSpaceDashboard, MdSpaceDashboard } from "react-icons/md"
import { BsPin, BsFillPinFill } from "react-icons/bs"
import { RiCalendarScheduleLine, RiCalendarScheduleFill } from "react-icons/ri"
import { PiTagSimpleBold, PiTagSimpleFill } from "react-icons/pi"
import { FaRegStar, FaStar, FaRegCheckCircle, FaCheckCircle } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { NewTaskModal } from "@/components/modals/new-task-modal"
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
    name: "Anasayfa", 
    count: null, 
    icon: MdOutlineSpaceDashboard, 
    activeIcon: MdSpaceDashboard, 
    color: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50", 
    activeColor: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/70 dark:to-indigo-900/70 text-blue-800 dark:text-blue-200 border-blue-300/70 dark:border-blue-700/70 shadow-lg shadow-blue-500/10", 
    href: ROUTES.DASHBOARD 
  },
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
    name: "Zamanlanmış", 
    count: 3, 
    icon: RiCalendarScheduleLine, 
    activeIcon: RiCalendarScheduleFill, 
    color: "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50", 
    activeColor: "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/70 dark:to-purple-900/70 text-violet-800 dark:text-violet-200 border-violet-300/70 dark:border-violet-700/70 shadow-lg shadow-violet-500/10", 
    href: ROUTES.SCHEDULED 
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
    name: "Tamamlandı", 
    count: 3, 
    icon: FaRegCheckCircle, 
    activeIcon: FaCheckCircle, 
    color: "bg-gradient-to-br from-green-50 to-lime-50 dark:from-green-950/50 dark:to-lime-950/50 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/50", 
    activeColor: "bg-gradient-to-br from-green-100 to-lime-100 dark:from-green-900/70 dark:to-lime-900/70 text-green-800 dark:text-green-200 border-green-300/70 dark:border-green-700/70 shadow-lg shadow-green-500/10", 
    href: ROUTES.COMPLETED 
  },
]


interface DashboardSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function DashboardSidebar({ isOpen, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const { projects, fetchProjects, createProject } = useProjectStore()
  const { tags, fetchTags } = useTagStore()
  const { getPinnedTasks, getPendingTasksCount, fetchTasks, tasks, getProjectCompletionPercentage, getTasksDueToday } = useTaskStore()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    fetchProjects()
    fetchTags()
    fetchTasks() // Tüm görevleri yükle
  }, [fetchProjects, fetchTags, fetchTasks])

  const handleCreateProject = async (name: string, emoji: string) => {
    try {
      await createProject(name, emoji)
    } catch {
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

  // Projeleri sırala - Gelen Kutusu en üste
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // Gelen Kutusu her zaman en üstte olsun
      if (a.name === "Gelen Kutusu") return -1
      if (b.name === "Gelen Kutusu") return 1
      // Diğer projeler alfabetik sırada
      return a.name.localeCompare(b.name, 'tr')
    })
  }, [projects])

  // Dinamik sayıları hesapla
  const getDynamicCount = (itemName: string) => {
    switch (itemName) {
      case "Bugün":
        return getTasksDueToday().length
      case "Pano":
        return getPinnedTasks().length
      case "Etiketler":
        return tags.length
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
          <div className="flex items-center pl-2">
            <FolderKanban className="h-7 w-7 mr-3 text-primary" />
            <h1 className="text-xl font-bold">Planner</h1>
          </div>
        ) : (
          <div className="flex-1" />
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
          {/* Add Task Button */}
          <div className="px-4 pt-2 pb-3">
            <Button
              variant="default"
              size="sm"
              className="w-full px-3 py-2"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Görev Ekle
            </Button>
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
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mb-3 px-2 border-b border-gray-300 dark:border-gray-600 pb-2 text-primary">
              <h3 className="text-sm font-medium ">Projeler</h3>
              <Plus 
                className="h-4 w-4 cursor-pointer" 
                onClick={() => setIsProjectModalOpen(true)}
              />
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
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{displayCount}</span>
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
          {/* Add Task Button - Collapsed - At Top */}
          <div className="p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="w-full h-9"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Görev Ekle</p>
              </TooltipContent>
            </Tooltip>
          </div>

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
      
      {/* Bottom Actions Section */}
      <div className="p-2 space-y-2">
        {isOpen ? (
          <>
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === THEME.DARK ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
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
                  className="h-9 w-9"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Arama</p>
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
      </div>
    </TooltipProvider>
  )
}