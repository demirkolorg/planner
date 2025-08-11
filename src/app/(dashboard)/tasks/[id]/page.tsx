"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskHeader } from "@/components/task/task-header"
import { TaskLayout } from "@/components/task/task-layout"
import { useAuthStore } from "@/store/authStore"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const taskId = params.id as string
  
  const [task, setTask] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Görev verilerini yükle
  const fetchTask = useCallback(async () => {
    if (!taskId || !user) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/tasks/${taskId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Görev bulunamadı")
        } else if (response.status === 403) {
          setError("Bu görevi görme yetkiniz yok")
        } else {
          setError("Görev yüklenirken hata oluştu")
        }
        return
      }

      const taskData = await response.json()
      setTask(taskData)
    } catch (error) {
      console.error("Task fetch error:", error)
      setError("Görev yüklenirken hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }, [taskId, user])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  // Loading state
  if (isLoading) {
    return (
      <div className="-m-6 min-h-screen bg-background">
        {/* Compact Header Skeleton */}
        <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              <div className="w-1 h-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-5 w-60 rounded bg-muted animate-pulse" />
                <div className="h-3 w-32 rounded bg-muted/60 animate-pulse" />
              </div>
              <div className="flex gap-1">
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact Content Skeleton */}
        <div className="bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Görev yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="-m-6 min-h-screen bg-background">
        <div className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-3 max-w-7xl">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-1 h-8 rounded-full bg-destructive/60"></div>
              <h1 className="text-lg font-semibold">Görev Detayı</h1>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-4xl mb-4">😕</div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-destructive">{error}</h2>
                  <p className="text-sm text-muted-foreground">
                    Göreve erişirken bir sorun oluştu
                  </p>
                </div>
                <div className="flex gap-2 justify-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.back()}
                    size="sm"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Geri
                  </Button>
                  <Button 
                    onClick={fetchTask}
                    size="sm"
                  >
                    Tekrar Dene
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main content
  if (!task) return null

  return (
    <div className="-m-6 min-h-screen bg-background">
      <TaskHeader 
        task={task} 
        onTaskUpdate={setTask}
        onBack={() => router.back()}
      />
      
      <div className="bg-muted/10">
        <TaskLayout 
          task={task}
          onTaskUpdate={setTask}
        />
      </div>
    </div>
  )
}