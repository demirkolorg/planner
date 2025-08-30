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
  Activity,
  FolderKanban,
  Zap
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectsArray } from "@/hooks/use-projects-migration"
import { useProjectStore } from "@/store/projectStore"
import { cn } from "@/lib/utils"

// Project analytics metrikleri
export interface ProjectMetrics {
  projectId: string
  projectName: string
  projectEmoji: string
  totalSections: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  averageTaskCompletionTime: number // günler
  productivityScore: number // 0-100
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  recentActivity: number // son 7 günde yapılan işlemler
  isPinned: boolean
  createdAt: string
  lastActivityDate?: string
  sectionsWithTasks: number // en az 1 görevi olan bölüm sayısı
  mostActiveSection?: {
    name: string
    taskCount: number
  }
}

interface ProjectAnalyticsDashboardProps {
  className?: string
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
]

export function ProjectAnalyticsDashboard({ 
  className 
}: ProjectAnalyticsDashboardProps) {
  const { tasks } = useTaskStore()
  const { sections } = useProjectStore()
  const projects = useProjectsArray()
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [sortBy, setSortBy] = useState<'productivity' | 'tasks' | 'completion' | 'recent'>('productivity')

  // Project metrics hesaplama
  const projectMetrics = useMemo(() => {
    const projectsArray = projects || []
    const tasksArray = tasks || []
    const sectionsArray = sections || []

    return projectsArray.map((project): ProjectMetrics => {
      const projectTasks = tasksArray.filter(task => task.project?.id === project.id)
      const projectSections = sectionsArray.filter(section => section.projectId === project.id)
      const completedTasks = projectTasks.filter(task => task.completed).length
      const pendingTasks = projectTasks.length - completedTasks
      
      // Overdue tasks
      const now = new Date()
      const overdueTasks = projectTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      ).length

      // Completion rate
      const completionRate = projectTasks.length > 0 
        ? Math.round((completedTasks / projectTasks.length) * 100)
        : 0

      // Average completion time
      const completedWithDates = projectTasks.filter(task => 
        task.completed && task.createdAt && task.completedAt
      )
      const averageTaskCompletionTime = completedWithDates.length > 0
        ? completedWithDates.reduce((acc, task) => {
            const created = new Date(task.createdAt!)
            const completed = new Date(task.completedAt!)
            return acc + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          }, 0) / completedWithDates.length
        : 0

      // Productivity score
      const timeScore = averageTaskCompletionTime > 0 ? Math.max(0, 100 - averageTaskCompletionTime * 1.5) : 50
      const activityScore = projectTasks.length > 0 ? Math.min(100, projectTasks.length * 5) : 0
      const productivityScore = Math.round((completionRate * 0.5) + (timeScore * 0.3) + (activityScore * 0.2))

      // Recent activity
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentActivity = projectTasks.filter(task => 
        new Date(task.updatedAt) > sevenDaysAgo
      ).length

      // Trend hesaplama
      const trend: 'up' | 'down' | 'stable' = 
        completionRate > 75 ? 'up' : 
        completionRate < 40 ? 'down' : 'stable'
      
      const trendPercentage = Math.abs(completionRate - 50)

      // Sections with tasks
      const sectionsWithTasks = projectSections.filter(section => 
        tasksArray.some(task => task.sectionId === section.id)
      ).length

      // Most active section
      let mostActiveSection: { name: string, taskCount: number } | undefined
      if (projectSections.length > 0) {
        const sectionTaskCounts = projectSections.map(section => ({
          name: section.name,
          taskCount: tasksArray.filter(task => task.sectionId === section.id).length
        }))
        mostActiveSection = sectionTaskCounts.reduce((max, current) => 
          current.taskCount > max.taskCount ? current : max
        )
      }

      // Last activity date
      const lastActivityDate = projectTasks.length > 0 
        ? projectTasks.reduce((latest, task) => {
            const taskDate = new Date(task.updatedAt)
            return taskDate > latest ? taskDate : latest
          }, new Date(0))
        : undefined

      return {
        projectId: project.id,
        projectName: project.name,
        projectEmoji: project.emoji || '📁',
        totalSections: projectSections.length,
        totalTasks: projectTasks.length,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        averageTaskCompletionTime: Math.round(averageTaskCompletionTime * 10) / 10,
        productivityScore,
        trend,
        trendPercentage: Math.round(trendPercentage),
        recentActivity,
        isPinned: project.isPinned || false,
        createdAt: project.createdAt,
        lastActivityDate: lastActivityDate?.toISOString(),
        sectionsWithTasks,
        mostActiveSection: mostActiveSection?.taskCount > 0 ? mostActiveSection : undefined
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'productivity':
          return b.productivityScore - a.productivityScore
        case 'tasks':
          return b.totalTasks - a.totalTasks
        case 'completion':
          return b.completionRate - a.completionRate
        case 'recent':
          return b.recentActivity - a.recentActivity
        default:
          return b.productivityScore - a.productivityScore
      }
    })
  }, [tasks, sections, projects, sortBy])

  // Chart data
  const chartData = useMemo(() => {
    return projectMetrics.map(metric => ({
      name: metric.projectName.length > 15 
        ? metric.projectName.substring(0, 12) + '...'
        : metric.projectName,
      fullName: metric.projectName,
      emoji: metric.projectEmoji,
      completionRate: metric.completionRate,
      totalTasks: metric.totalTasks,
      completedTasks: metric.completedTasks,
      pendingTasks: metric.pendingTasks,
      productivityScore: metric.productivityScore,
      sections: metric.totalSections,
      recentActivity: metric.recentActivity
    }))
  }, [projectMetrics])

  // Overall stats
  const overallStats = useMemo(() => {
    const totalProjects = projectMetrics.length
    const totalTasks = projectMetrics.reduce((acc, m) => acc + m.totalTasks, 0)
    const totalCompleted = projectMetrics.reduce((acc, m) => acc + m.completedTasks, 0)
    const totalSections = projectMetrics.reduce((acc, m) => acc + m.totalSections, 0)
    const totalOverdue = projectMetrics.reduce((acc, m) => acc + m.overdueTasks, 0)
    const averageCompletionRate = totalProjects > 0 
      ? Math.round(projectMetrics.reduce((acc, m) => acc + m.completionRate, 0) / totalProjects)
      : 0
    const activeProjects = projectMetrics.filter(m => m.recentActivity > 0).length
    const pinnedProjects = projectMetrics.filter(m => m.isPinned).length

    return {
      totalProjects,
      totalTasks,
      totalCompleted,
      totalSections,
      totalOverdue,
      averageCompletionRate,
      activeProjects,
      pinnedProjects
    }
  }, [projectMetrics])

  if (projectMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Henüz proje analiz verisi yok</h3>
            <p className="text-muted-foreground">
              Proje analizi için önce projeler ve görevler oluşturun
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
          <h2 className="text-2xl font-bold tracking-tight">Proje Performans Analizi</h2>
          <p className="text-muted-foreground">
            Projelerinizin genel performansını ve verimliliğini analiz edin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: 'productivity' | 'tasks' | 'completion' | 'recent') => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="productivity">Verimlilik</SelectItem>
              <SelectItem value="tasks">Görev Sayısı</SelectItem>
              <SelectItem value="completion">Tamamlanma</SelectItem>
              <SelectItem value="recent">Son Aktivite</SelectItem>
            </SelectContent>
          </Select>
          
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
            <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.activeProjects} aktif • {overallStats.pinnedProjects} sabitlenmiş
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
            <CardTitle className="text-sm font-medium">Toplam Bölüm</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalSections}</div>
            <p className="text-xs text-muted-foreground">
              Ortalama {Math.round(overallStats.totalSections / Math.max(overallStats.totalProjects, 1))} bölüm/proje
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
      </div>

      {/* Ana Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proje Performans Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Proje Performans Skorları</CardTitle>
            <CardDescription>
              Her projenin genel performans puanı (0-100)
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
                          <p className="font-medium">{data.emoji} {data.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Performans Skoru: <span className="font-medium">{data.productivityScore}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Görevler: {data.completedTasks}/{data.totalTasks}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Bölümler: {data.sections}
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

        {/* Proje Aktivite Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Proje Aktivite Karşılaştırması</CardTitle>
            <CardDescription>
              Son {timeRange === '7d' ? '7 gün' : timeRange === '30d' ? '30 gün' : '90 gün'}de aktivite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                          <p className="font-medium">{data.emoji} {data.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            Son aktivite: <span className="font-medium">{data.recentActivity} işlem</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="recentActivity" 
                  fill="#82ca9d"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Proje Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Proje Detay Analizi</CardTitle>
          <CardDescription>
            Her projenin detaylı performans metrikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectMetrics.map((metric, index) => (
              <div 
                key={metric.projectId}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{metric.projectEmoji}</span>
                    <h4 className="font-medium">{metric.projectName}</h4>
                    {metric.isPinned && (
                      <Badge variant="secondary" className="text-xs">
                        📌 Sabitlenmiş
                      </Badge>
                    )}
                    {index < 3 && (
                      <Badge className="text-xs">
                        🏆 Top {index + 1}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {metric.totalSections} bölüm
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {metric.completedTasks}/{metric.totalTasks} görev
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {metric.averageTaskCompletionTime}g ort.
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {metric.recentActivity} son aktivite
                    </span>
                    {metric.overdueTasks > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {metric.overdueTasks} gecikmiş
                      </span>
                    )}
                  </div>

                  {metric.mostActiveSection && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      En aktif bölüm: <span className="font-medium">{metric.mostActiveSection.name}</span> ({metric.mostActiveSection.taskCount} görev)
                    </div>
                  )}
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
                        <Zap className="h-3 w-3 text-yellow-500" />
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