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
import { useRouter } from "next/navigation"

const cardItems = [
  { name: "Anasayfa", count: null, icon: MdOutlineSpaceDashboard, activeIcon: MdSpaceDashboard, color: "bg-slate-800 text-slate-300 border-slate-700", activeColor: "bg-slate-700 text-slate-200 border-slate-600", href: ROUTES.DASHBOARD },
  { name: "Bugün", count: 1, icon: FaRegStar, activeIcon: FaStar, color: "bg-green-900/30 text-green-300 border-green-700", activeColor: "bg-green-800/50 text-green-200 border-green-600", href: ROUTES.TODAY },
  { name: "Zamanlanmış", count: 3, icon: RiCalendarScheduleLine, activeIcon: RiCalendarScheduleFill, color: "bg-purple-900/30 text-purple-300 border-purple-700", activeColor: "bg-purple-800/50 text-purple-200 border-purple-600", href: ROUTES.SCHEDULED },
  { name: "Pano", count: 2, icon: BsPin, activeIcon: BsFillPinFill, color: "bg-red-900/30 text-red-300 border-red-700", activeColor: "bg-red-800/50 text-red-200 border-red-600", href: ROUTES.BOARD },
  { name: "Etiketler", count: 2, icon: PiTagSimpleBold, activeIcon: PiTagSimpleFill, color: "bg-amber-900/30 text-amber-300 border-amber-700", activeColor: "bg-amber-800/50 text-amber-200 border-amber-600", href: ROUTES.TAGS },
  { name: "Tamamlandı", count: 3, icon: FaRegCheckCircle, activeIcon: FaCheckCircle, color: "bg-orange-900/30 text-orange-300 border-orange-700", activeColor: "bg-orange-800/50 text-orange-200 border-orange-600", href: ROUTES.COMPLETED },
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
  const { getPinnedTasks, getPendingTasksCount, fetchTasks, tasks } = useTaskStore()
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
                      "p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
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
            <div className="flex items-center justify-between mb-3 px-2 border-b-1 border-gray-600 dark:border-gray-600  pb-2 text-primary">
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
                
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-800 transition-colors group"
                  >
                    <div className="flex items-center space-x-2">
                      {project.emoji ? (
                        <span className="text-sm">{project.emoji}</span>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                      <span className="text-sm text-gray-300">{project.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{displayCount}</span>
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
          <div className="mx-2 border-t border-sidebar-border" />

          {/* Collapsed Projects */}
          <div className="flex-1 p-2 space-y-2 overflow-y-auto">
            {sortedProjects.map((project) => (
              <Tooltip key={project.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={`/projects/${project.id}`}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-accent",
                      pathname === `/projects/${project.id}` ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
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
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
      
      {/* Bottom Actions Section */}
      <div className="p-2 border-t border-sidebar-border space-y-2">
        {isOpen ? (
          <>
            {/* Add Task Button - Full width when expanded */}
            <Button
              variant="default"
              size="sm"
              className="w-full px-3 py-2"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Görev Ekle
            </Button>
            
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
                  variant="default"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Görev Ekle</p>
              </TooltipContent>
            </Tooltip>
            
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