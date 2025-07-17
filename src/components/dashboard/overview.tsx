"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen, CheckSquare, Clock, TrendingUp } from "lucide-react"

export function DashboardOverview() {
  const stats = [
    {
      title: "Toplam Proje",
      value: "12",
      description: "Aktif projeler",
      icon: FolderOpen,
      color: "text-blue-600"
    },
    {
      title: "Toplam Görev",
      value: "48",
      description: "Tüm görevler",
      icon: CheckSquare,
      color: "text-green-600"
    },
    {
      title: "Bekleyen Görevler",
      value: "15",
      description: "Tamamlanmaya hazır",
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Tamamlanan",
      value: "33",
      description: "Bu ay tamamlanan",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="space-y-6">
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