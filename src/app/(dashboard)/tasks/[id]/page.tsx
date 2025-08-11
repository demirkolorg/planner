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
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              <div className="h-6 w-64 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Görev yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-muted-foreground">
                Görev Detayı
              </h1>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">
                {error}
              </h2>
              <p className="text-muted-foreground mb-4">
                Görev yüklenirken bir sorun oluştu.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  Geri Dön
                </Button>
                <Button onClick={fetchTask}>
                  Tekrar Dene
                </Button>
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
    <div className="min-h-screen bg-background">
      {/* Task Header */}
      <TaskHeader 
        task={task} 
        onTaskUpdate={setTask}
        onBack={() => router.back()}
      />
      
      {/* Task Layout (3 columns) */}
      <TaskLayout 
        task={task}
        onTaskUpdate={setTask}
      />
    </div>
  )
}