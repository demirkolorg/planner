"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, CheckSquare, Clock, TrendingUp, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useEffect } from "react"
import Link from "next/link"

export function DashboardOverview() {
  const { tasks, fetchTasks, getOverdueTasksCount, getTasksDueToday } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [])

  const overdueCount = getOverdueTasksCount()
  const dueTodayCount = getTasksDueToday().length
  const completedCount = tasks.filter(task => task.completed).length
  const pendingCount = tasks.filter(task => !task.completed).length

  const stats = [
    {
      title: "Toplam Proje",
      value: projects.length.toString(),
      description: "Aktif projeler",
      icon: FolderOpen,
      color: "text-blue-600"
    },
    {
      title: "Toplam Görev",
      value: tasks.length.toString(),
      description: "Tüm görevler",
      icon: CheckSquare,
      color: "text-green-600"
    },
    {
      title: "Bekleyen Görevler",
      value: pendingCount.toString(),
      description: "Tamamlanmaya hazır",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Tamamlanan",
      value: completedCount.toString(),
      description: "Tamamlanan görevler",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overdue Tasks Alert */}
      {overdueCount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  {overdueCount} görevinizin süresi geçmiş!
                </h3>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Bu görevlere öncelik verin veya son tarihlerini güncelleyin.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link 
                  href="/tasks" 
                  className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                >
                  Görüntüle →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Today Tasks Alert */}
      {dueTodayCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-orange-800 dark:text-orange-200">
                  {dueTodayCount} göreviniz bugün bitiyor!
                </h3>
                <p className="mt-1 text-sm text-orange-600 dark:text-orange-400">
                  Bu görevleri bugün tamamlamaya odaklanın.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link 
                  href="/today" 
                  className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Görüntüle →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Projeler</CardTitle>
            <CardDescription>
              En son oluşturulan projeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Web Uygulaması</p>
                  <p className="text-xs text-muted-foreground">2 gün önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Mobil Uygulama</p>
                  <p className="text-xs text-muted-foreground">1 hafta önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">API Entegrasyonu</p>
                  <p className="text-xs text-muted-foreground">2 hafta önce</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Görevler</CardTitle>
            <CardDescription>
              En son oluşturulan görevler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Veritabanı tasarımı</p>
                  <p className="text-xs text-muted-foreground">Bugün</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">UI/UX tasarımı</p>
                  <p className="text-xs text-muted-foreground">Dün</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Test yazımı</p>
                  <p className="text-xs text-muted-foreground">3 gün önce</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}