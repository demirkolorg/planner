"use client"

// Force dynamic rendering to avoid SSR issues with EventSource
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { ROUTES } from "@/lib/constants"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SplashScreen } from "@/components/ui/splash-screen"
// Lazy load modals for better performance
import { lazy, Suspense } from "react"

const QuickTaskModal = lazy(() => import("@/components/modals/quick-task-modal").then(mod => ({ default: mod.QuickTaskModal })))
const QuickSearchModal = lazy(() => import("@/components/modals/quick-search-modal").then(mod => ({ default: mod.QuickSearchModal })))
const NewTaskModal = lazy(() => import("@/components/modals/new-task-modal").then(mod => ({ default: mod.NewTaskModal })))
import { ToastNotification } from "@/components/ui/toast-notification"
import { useAutoNotifications } from "@/hooks/use-notifications"
import { useCtrlK, useCtrlS, useCtrlJ, useCtrlB } from "@/hooks/use-keyboard-shortcut"

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
  const [isQuickSearchModalOpen, setIsQuickSearchModalOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const lastUserIdRef = useRef<string | null>(null)

  
  // Notification system'i aktif et
  useAutoNotifications()

  // Ctrl+K shortcut
  useCtrlK(() => {
    if (isAuthenticated) {
      setIsQuickTaskModalOpen(true)
    }
  })

  // Ctrl+S shortcut
  useCtrlS(() => {
    if (isAuthenticated) {
      setIsQuickSearchModalOpen(true)
    }
  })

  // Ctrl+J shortcut
  useCtrlJ(() => {
    if (isAuthenticated) {
      console.log('Ctrl+J pressed, opening new task modal')
      setIsNewTaskModalOpen(true)
    }
  })

  // Ctrl+B shortcut
  useCtrlB(() => {
    if (isAuthenticated) {
      setSidebarOpen(!sidebarOpen)
    }
  })

  useEffect(() => {
    // Zustand persist hydration'ı bekle
    const timer = setTimeout(async () => {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN)
        setIsLoading(false)
        return
      }

      try {
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
        
        // Sadece kullanıcı değişti ise veya ilk kez yükleniyor ise data fetch et
        const shouldFetchData = (lastUserIdRef.current !== currentUserId) || (tasks.length === 0)
        if (shouldFetchData) {
          // Timeout ile API çağrılarını sınırla
          const loadingTimeout = setTimeout(() => {
            console.warn('Data loading taking too long, proceeding without data')
            setIsLoading(false)
          }, 25000) // 25 saniye timeout - tüm operasyonlar için yeterli

          try {
            await Promise.race([
              Promise.all([
                fetchTasks().catch(error => {
                  console.error('Failed to fetch tasks:', error)
                  return [] // Silent fail, dashboard'u engellemez
                }),
                fetchProjects().catch(error => {
                  console.error('Failed to fetch projects:', error)
                  return [] // Silent fail, dashboard'u engellemez
                })
              ]),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 20000) // 20 saniye - store timeout'larından uzun
              )
            ])
            clearTimeout(loadingTimeout)
          } catch (error) {
            console.warn('Data loading failed or timed out:', error)
            clearTimeout(loadingTimeout)
          }
        }
      } catch (error) {
        console.error('Dashboard loading error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user?.id, router, fetchTasks, fetchProjects]) // tasks.length kaldırıldı - infinite loop'a neden oluyordu

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
        onOpenSearch={() => setIsQuickSearchModalOpen(true)}
      />
      <div className={`flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-80' : 'ml-16'} w-full`}>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Lazy-loaded Modals with Suspense fallback */}
      {isQuickTaskModalOpen && (
        <Suspense fallback={<div className="modal-loading">Loading...</div>}>
          <QuickTaskModal
            isOpen={isQuickTaskModalOpen}
            onClose={() => setIsQuickTaskModalOpen(false)}
          />
        </Suspense>
      )}
      
      {isQuickSearchModalOpen && (
        <Suspense fallback={<div className="modal-loading">Loading...</div>}>
          <QuickSearchModal
            isOpen={isQuickSearchModalOpen}
            onClose={() => setIsQuickSearchModalOpen(false)}
          />
        </Suspense>
      )}
      
      {isNewTaskModalOpen && (
        <Suspense fallback={<div className="modal-loading">Loading...</div>}>
          <NewTaskModal
            isOpen={isNewTaskModalOpen}
            onClose={() => setIsNewTaskModalOpen(false)}
            onTaskCreated={() => {
              setIsNewTaskModalOpen(false)
            }}
          />
        </Suspense>
      )}
      
      {/* Toast Notifications */}
      <ToastNotification />
    </div>
  )
}