"use client"

import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants"
import { Inbox, Star, Clock, Tag, CheckSquare, Plus, FolderKanban, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

const cardItems = [
  { name: "Gelen Kutusu", count: null, icon: Inbox, color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700", activeColor: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600", href: ROUTES.DASHBOARD },
  { name: "Bugün", count: 1, icon: Star, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700", activeColor: "bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600", href: ROUTES.TODAY },
  { name: "Zamanlanmış", count: 3, icon: Clock, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700", activeColor: "bg-purple-200 dark:bg-purple-800/50 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600", href: ROUTES.SCHEDULED },
  { name: "Pano", count: 2, icon: Pin, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700", activeColor: "bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600", href: ROUTES.BOARD },
  { name: "Etiketler", count: 2, icon: Tag, color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700", activeColor: "bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-600", href: ROUTES.TAGS },
  { name: "Tamamlandı", count: 3, icon: CheckSquare, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700", activeColor: "bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-600", href: ROUTES.COMPLETED },
]

const projects = [
  { name: "Proje 1", count: 10, href: ROUTES.PROJECTS },
  { name: "Proje Yeni", count: 10, href: ROUTES.PROJECTS },
  { name: "Asfaltlama Projesi", count: 4, href: ROUTES.PROJECTS },
]

interface DashboardSidebarProps {
  isOpen: boolean
}

export function DashboardSidebar({ isOpen }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex h-full w-80 flex-col bg-muted/20 transition-transform duration-300 ease-in-out fixed left-0 top-0 p-2 z-10",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex h-14 items-center px-4">
        <FolderKanban className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
        <h1 className="text-xl font-bold">Planner</h1>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {cardItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "p-3 rounded-lg border transition-all duration-200 hover:shadow-md",
                pathname === item.href ? item.activeColor : item.color
              )}
            >
              <div className="flex items-center justify-between">
                <item.icon className="h-5 w-5" />
                {item.count !== null && (
                  <span className="text-sm font-medium">{item.count}</span>
                )}
              </div>
              <div className="mt-2 text-sm font-medium">{item.name}</div>
            </Link>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" className="text-sm font-medium">
              Projeler
            </Button>
            <Plus className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" />
          </div>
          
          <div className="space-y-0.5">
            {projects.map((project) => (
              <Link
                key={project.name}
                href={project.href}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-sm">{project.name}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{project.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}