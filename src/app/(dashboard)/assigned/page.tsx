"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/task/task-card'
import { Users, CheckCircle, Clock, RefreshCw, Filter, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'

interface AssignedTask extends Task {
  assignments: Array<{
    id: string
    assigneeId: string
    assignedBy: string
    assignedAt: string
    assignee: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    assigner: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function AssignedTasksPage() {
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('pending')

  // Atanan görevleri getir
  const fetchAssignedTasks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/tasks/assigned')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        const errorData = await response.json()
        console.error('API Error Response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Atanan görevler alınamadı')
      }
    } catch (error) {
      console.error('Error fetching assigned tasks:', error)
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedTasks()
  }, [])

  // Görev tamamlama durumunu değiştir
  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })

      if (response.ok) {
        // Optimistic update
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
          )
        )
      }
    } catch (error) {
      console.error('Task toggle error:', error)
    }
  }

  // Kullanıcı atama fonksiyonu - smooth refresh
  const handleAssignUser = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: userId })
      })

      if (response.ok) {
        // API düzeltildi, daha hızlı refresh yapabiliriz
        setTimeout(async () => {
          await fetchAssignedTasks()
        }, 100)
      }
    } catch (error) {
      console.error('User assignment error:', error)
    }
  }

  // Kullanıcı atama kaldırma fonksiyonu - smooth refresh
  const handleUnassignUser = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: userId })
      })

      if (response.ok) {
        // API düzeltildi, daha hızlı refresh yapabiliriz
        setTimeout(async () => {
          await fetchAssignedTasks()
        }, 100)
      }
    } catch (error) {
      console.error('User unassignment error:', error)
    }
  }

  // Atama güncelleme fonksiyonu - TaskCard için gerekli
  const handleUpdateAssignment = async (taskId: string, updates: any) => {
    try {
      // Optimistic update
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      )

      // Görev güncellemesi
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        // Hata durumunda geri al
        await fetchAssignedTasks()
        throw new Error('Görev güncellenemedi')
      }
    } catch (error) {
      console.error('Assignment update error:', error)
      // Hata durumunda listeyi yenile
      await fetchAssignedTasks()
    }
  }

  // Filtrelenmiş görevler
  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'completed':
        return task.completed
      case 'pending':
        return !task.completed
      default:
        return true
    }
  })

  // İstatistikler
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length
  }

  // Loading durumu
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Bana Atanan Görevler</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-16 h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error durumu
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Bana Atanan Görevler</h1>
            <p className="text-destructive">{error}</p>
          </div>
          <Button onClick={fetchAssignedTasks} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8" />
            Bana Atanan Görevler
          </h1>
          <p className="text-muted-foreground">
            Size atanan {stats.total} görevin listesi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={fetchAssignedTasks} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Yenile
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tümü ({stats.total})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Bekleyen ({stats.pending})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Tamamlanan ({stats.completed})
          </Button>
        </div>
      </div>

      {/* Görev Listesi */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {filter === 'all' ? 'Henüz size atanan görev yok' :
               filter === 'pending' ? 'Bekleyen görev yok' :
               'Tamamlanan görev yok'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {filter === 'all' 
                ? 'Takım arkadaşlarınız size görev atadığında burada görünecek.'
                : filter === 'pending'
                ? 'Tüm görevleri tamamladınız! 🎉'
                : 'Henüz tamamladığınız atanan görev bulunmuyor.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onUpdateAssignment={handleUpdateAssignment}
              onAssignUser={handleAssignUser}
              onUnassignUser={handleUnassignUser}
            />
          ))}
        </div>
      )}
    </div>
  )
}