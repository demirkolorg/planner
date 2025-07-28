"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useTaskStore } from "@/store/taskStore"
import { ROUTES } from "@/lib/constants"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useReminderCheck, useReminderCheckOnFocus } from "@/hooks/useReminderCheck"

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

  // Hatırlatıcı kontrol sistemini başlat
  useReminderCheck({ enabled: isAuthenticated })
  useReminderCheckOnFocus()

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Planner</h1>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Planner</h1>
          <p className="text-muted-foreground">Yönlendiriliyor...</p>
        </div>
      </div>
    )
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