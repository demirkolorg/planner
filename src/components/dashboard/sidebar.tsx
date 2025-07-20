"use client"

import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Plus, FolderKanban, Folder } from "lucide-react"
import { MdOutlineSpaceDashboard, MdSpaceDashboard } from "react-icons/md"
import { BsPin, BsFillPinFill } from "react-icons/bs"
import { RiCalendarScheduleLine, RiCalendarScheduleFill } from "react-icons/ri"
import { PiTagSimpleBold, PiTagSimpleFill } from "react-icons/pi"
import { FaRegStar, FaStar, FaRegCheckCircle, FaCheckCircle } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { BRAND_COLOR } from "@/lib/constants"

const cardItems = [
  { name: "Anasayfa", count: null, icon: MdOutlineSpaceDashboard, activeIcon: MdSpaceDashboard, color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700", activeColor: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600", href: ROUTES.DASHBOARD },
  { name: "Bugün", count: 1, icon: FaRegStar, activeIcon: FaStar, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700", activeColor: "bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600", href: ROUTES.TODAY },
  { name: "Zamanlanmış", count: 3, icon: RiCalendarScheduleLine, activeIcon: RiCalendarScheduleFill, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700", activeColor: "bg-purple-200 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600", href: ROUTES.SCHEDULED },
  { name: "Pano", count: 2, icon: BsPin, activeIcon: BsFillPinFill, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700", activeColor: "bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600", href: ROUTES.BOARD },
  { name: "Etiketler", count: 2, icon: PiTagSimpleBold, activeIcon: PiTagSimpleFill, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700", activeColor: "bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600", href: ROUTES.TAGS },
  { name: "Tamamlandı", count: 3, icon: FaRegCheckCircle, activeIcon: FaCheckCircle, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700", activeColor: "bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-600", href: ROUTES.COMPLETED },
]


interface DashboardSidebarProps {
  isOpen: boolean
}

export function DashboardSidebar({ isOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const { projects, fetchProjects, createProject } = useProjectStore()
  const { tags, fetchTags } = useTagStore()
  const { getTasksByProject, getPinnedTasks, fetchTasks, tasks } = useTaskStore()

  useEffect(() => {
    fetchProjects()
    fetchTags()
    fetchTasks() // Tüm görevleri yükle
  }, [fetchProjects, fetchTags, fetchTasks])

  const handleCreateProject = async (name: string, emoji: string) => {
    try {
      await createProject(name, emoji)
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

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
    <div className={cn(
      "flex h-full w-80 flex-col bg-muted/20 transition-transform duration-300 ease-in-out fixed left-0 top-0 p-2 z-10",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-14 items-center px-4">
        <FolderKanban className="h-6 w-6 mr-3" style={{ color: BRAND_COLOR }} />
        <h1 className="text-xl font-bold">Planner</h1>
      </div>
      
      <div className="p-4 space-y-3">
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
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-2 border-b-1 pb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Projeler</h3>
            <Plus 
              className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" 
              onClick={() => setIsProjectModalOpen(true)}
            />
          </div>
          
          <div className="space-y-1">
            {projects.map((project) => {
              // TaskStore'dan gerçek görev sayısını al
              const taskStoreCount = getTasksByProject(project.id).length
              // API'den gelen sayı
              const apiCount = project._count?.tasks || 0
              // Eğer taskStore'da görevler yüklendiyse onu kullan, yoksa API'den gelen sayıyı kullan
              const displayCount = tasks.length > 0 ? taskStoreCount : apiCount
              
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{displayCount}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleCreateProject}
      />
    </div>
  )
}