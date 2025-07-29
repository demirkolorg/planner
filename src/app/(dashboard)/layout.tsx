"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { ROUTES } from "@/lib/constants"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SplashScreen } from "@/components/ui/splash-screen"
import { QuickTaskModal } from "@/components/modals/quick-task-modal"
import { useCtrlK } from "@/hooks/use-keyboard-shortcut"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user } = useAuthStore()
  const { fetchTasks, tasks } = useTaskStore()
  const { fetchProjects } = useProjectStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false)
  const lastUserIdRef = useRef<string | null>(null)

  // Ctrl+K shortcut
  useCtrlK(() => {
    if (isAuthenticated) {
      setIsQuickTaskModalOpen(true)
    }
  })

  useEffect(() => {
    // Zustand persist hydration'ı bekle
    const timer = setTimeout(async () => {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN)
      } else {
        // Kullanıcı değişti mi kontrol et
        const currentUserId = user?.id || null
        if (lastUserIdRef.current !== currentUserId) {
          // Farklı kullanıcı - store'ları temizle ve yeniden yükle
          console.log('Kullanıcı değişti, store temizleniyor...', {
            previous: lastUserIdRef.current,
            current: currentUserId
          })
          
          // Store'ları temizle
          useTaskStore.setState({
            tasks: [],
            isLoading: false,
            error: null,
            showCompletedTasks: false
          })
          
          useProjectStore.setState({
            projects: [],
            sections: [],
            isLoading: false,
            error: null
          })
          
          lastUserIdRef.current = currentUserId
        }
        
        // Kullanıcı giriş yapmışsa ve store boşsa verileri yükle
        if (tasks.length === 0) {
          await Promise.all([
            fetchTasks(),
            fetchProjects()
          ])
        }
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user?.id, router, fetchTasks, fetchProjects, tasks.length])

  if (isLoading) {
    return <SplashScreen message="Dashboard yükleniyor..." />
  }

  if (!isAuthenticated) {
    return <SplashScreen message="Yönlendiriliyor..." />
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className={`flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-80' : 'ml-16'} w-full`}>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Quick Task Modal */}
      <QuickTaskModal
        isOpen={isQuickTaskModalOpen}
        onClose={() => setIsQuickTaskModalOpen(false)}
      />
    </div>
  )
}