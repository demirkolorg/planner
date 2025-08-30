"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3, 
  Calendar,
  Users,
  Target,
  Activity
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectsArray } from "@/hooks/use-projects-migration"
import { cn } from "@/lib/utils"

// Analytics hesaplama fonksiyonları
export interface SectionMetrics {
  sectionId: string
  sectionName: string
  projectName: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number // günler
  productivityScore: number // 0-100
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  recentActivity: number // son 7 günde yapılan işlemler
  assignedMembers: number
}

interface SectionAnalyticsDashboardProps {
  sections?: any[] // Section array'i prop olarak al
  projectId?: string
  className?: string
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
]

export function SectionAnalyticsDashboard({ 
  sections: propSections,
  projectId, 
  className 
}: SectionAnalyticsDashboardProps) {
  const { tasks, sections: storeSections } = useTaskStore()
  const projects = useProjectsArray()
  
  // Prop'tan gelen sections'ı öncelikle kullan, yoksa store'dan al
  const sectionsToUse = propSections || storeSections
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedProject, setSelectedProject] = useState<string>(projectId || 'all')

  // Section metrics hesaplama
  const sectionMetrics = useMemo(() => {
    // sectionsToUse undefined olabilir, o yüzden boş array ile fallback yap
    const sectionsArray = sectionsToUse || []
    
    const filteredSections = projectId 
      ? sectionsArray.filter(s => s.projectId === projectId)
      : sectionsArray

    return filteredSections.map((section): SectionMetrics => {
      const tasksArray = tasks || []
      const sectionTasks = tasksArray.filter(task => task.sectionId === section.id)
      const completedTasks = sectionTasks.filter(task => task.completed).length
      const pendingTasks = sectionTasks.length - completedTasks
      
      // Overdue tasks (süresi geçmiş)
      const now = new Date()
      const overdueTasks = sectionTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      ).length

      // Completion rate
      const completionRate = sectionTasks.length > 0 
        ? Math.round((completedTasks / sectionTasks.length) * 100)
        : 0

      // Average completion time (örnek hesaplama)
      const completedWithDates = sectionTasks.filter(task => 
        task.completed && task.createdAt && task.completedAt
      )
      const averageCompletionTime = completedWithDates.length > 0
        ? completedWithDates.reduce((acc, task) => {
            const created = new Date(task.createdAt!)
            const completed = new Date(task.completedAt!)
            return acc + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          }, 0) / completedWithDates.length
        : 0

      // Productivity score (completion rate + time factor)
      const timeScore = averageCompletionTime > 0 ? Math.max(0, 100 - averageCompletionTime * 2) : 50
      const productivityScore = Math.round((completionRate * 0.7) + (timeScore * 0.3))

      // Recent activity (son 7 gün)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentActivity = sectionTasks.filter(task => 
        new Date(task.updatedAt) > sevenDaysAgo
      ).length

      // Trend hesaplama (basit örnek)
      const trend: 'up' | 'down' | 'stable' = 
        completionRate > 75 ? 'up' : 
        completionRate < 50 ? 'down' : 'stable'
      
      const trendPercentage = Math.abs(completionRate - 50)

      const projectsArray = projects || []
      const project = projectsArray.find(p => p.id === section.projectId)

      return {
        sectionId: section.id,
        sectionName: section.name,
        projectName: project?.name || 'Bilinmeyen Proje',
        totalTasks: sectionTasks.length,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        productivityScore,
        trend,
        trendPercentage: Math.round(trendPercentage),
        recentActivity,
        assignedMembers: 1 // Şimdilik sabit, gelecekte user assignment'tan alınacak
      }
    }).sort((a, b) => b.productivityScore - a.productivityScore)
  }, [tasks, sectionsToUse, projects, projectId])

  // Chart data hazırlama
  const chartData = useMemo(() => {
    return sectionMetrics.map(metric => ({
      name: metric.sectionName.length > 15 
        ? metric.sectionName.substring(0, 12) + '...'
        : metric.sectionName,
      fullName: metric.sectionName,
      completionRate: metric.completionRate,
      totalTasks: metric.totalTasks,
      completedTasks: metric.completedTasks,
      pendingTasks: metric.pendingTasks,
      productivityScore: metric.productivityScore,
      averageTime: metric.averageCompletionTime
    }))
  }, [sectionMetrics])

  // Genel istatistikler
  const overallStats = useMemo(() => {
    const totalSections = sectionMetrics.length
    const totalTasks = sectionMetrics.reduce((acc, m) => acc + m.totalTasks, 0)
    const totalCompleted = sectionMetrics.reduce((acc, m) => acc + m.completedTasks, 0)
    const totalOverdue = sectionMetrics.reduce((acc, m) => acc + m.overdueTasks, 0)
    const averageCompletionRate = totalSections > 0 
      ? Math.round(sectionMetrics.reduce((acc, m) => acc + m.completionRate, 0) / totalSections)
      : 0
    const topPerformingSections = sectionMetrics.filter(m => m.productivityScore > 75).length

    return {
      totalSections,
      totalTasks,
      totalCompleted,
      totalOverdue,
      averageCompletionRate,
      topPerformingSections
    }
  }, [sectionMetrics])

  if (sectionMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Henüz analiz verisi yok</h3>
            <p className="text-muted-foreground">
              Bölüm analizi için önce görevler oluşturun
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header ve Filtreler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bölüm Performans Analizi</h2>
          <p className="text-muted-foreground">
            Bölümlerinizin verimliliğini ve performansını analiz edin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!projectId && (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Proje seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Projeler</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.emoji} {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
              <SelectItem value="90d">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Genel İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bölüm</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSections}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.topPerformingSections} yüksek performanslı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalCompleted} tamamlanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Tamamlanma</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{overallStats.averageCompletionRate}</div>
            <Progress value={overallStats.averageCompletionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Geçmiş</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overallStats.totalOverdue}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam görevlerin %{Math.round((overallStats.totalOverdue / overallStats.totalTasks) * 100) || 0}'si
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bölüm Performans Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Bölüm Performans Skorları</CardTitle>
            <CardDescription>
              Her bölümün genel performans puanı (0-100)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Performans Skoru: <span className="font-medium">{data.productivityScore}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Tamamlanan: {data.completedTasks}/{data.totalTasks}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="productivityScore" 
                  fill="#8884d8"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tamamlanma Oranları Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Görev Dağılımı</CardTitle>
            <CardDescription>
              Tüm bölümlerde görev durumu dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Tamamlanan', value: overallStats.totalCompleted, color: '#22c55e' },
                    { name: 'Devam Eden', value: overallStats.totalTasks - overallStats.totalCompleted - overallStats.totalOverdue, color: '#3b82f6' },
                    { name: 'Süresi Geçmiş', value: overallStats.totalOverdue, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Bölüm Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Bölüm Detay Analizi</CardTitle>
          <CardDescription>
            Her bölümün detaylı performans metrikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectionMetrics.map((metric, index) => (
              <div 
                key={metric.sectionId}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{metric.sectionName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {metric.projectName}
                    </Badge>
                    {index < 3 && (
                      <Badge className="text-xs">
                        Top {index + 1}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {metric.completedTasks}/{metric.totalTasks}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {metric.averageCompletionTime}g ort.
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {metric.assignedMembers} üye
                    </span>
                    {metric.overdueTasks > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {metric.overdueTasks} gecikmiş
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Completion Progress */}
                  <div className="w-24">
                    <Progress value={metric.completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      %{metric.completionRate}
                    </p>
                  </div>

                  {/* Productivity Score */}
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {metric.productivityScore}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {metric.trend === 'up' && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      {metric.trend === 'down' && (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      {metric.trend === 'stable' && (
                        <div className="h-3 w-3" />
                      )}
                      <span className="text-muted-foreground">
                        {metric.trend !== 'stable' && `%${metric.trendPercentage}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}