"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useTaskStore } from "@/store/taskStore"
import { ROUTES } from "@/lib/constants"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SplashScreen } from "@/components/ui/splash-screen"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthStore()
  const { fetchTasks } = useTaskStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Zustand persist hydration'ı bekle
    const timer = setTimeout(async () => {
      if (!isAuthenticated) {
        router.push(ROUTES.LOGIN)
      } else {
        // Kullanıcı giriş yapmışsa görevleri yükle
        await fetchTasks()
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, router, fetchTasks])

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
    </div>
  )
}