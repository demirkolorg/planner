"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Target,
  Activity,
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectsArray } from "@/hooks/use-projects-migration"
import { cn } from "@/lib/utils"

// Timeline data types
interface TimelineDataPoint {
  date: string
  dateLabel: string
  tasksCreated: number
  tasksCompleted: number
  tasksOverdue: number
  totalTasks: number
  completionRate: number
  productivity: number
  activeProjects: number
}

interface PeriodComparison {
  current: {
    period: string
    tasksCompleted: number
    completionRate: number
    avgCompletionTime: number
    productivity: number
  }
  previous: {
    period: string
    tasksCompleted: number
    completionRate: number
    avgCompletionTime: number
    productivity: number
  }
  changes: {
    tasksCompleted: number
    completionRate: number
    avgCompletionTime: number
    productivity: number
  }
}

interface TimelineAnalyticsDashboardProps {
  className?: string
}

const CHART_COLORS = {
  created: '#3b82f6',
  completed: '#22c55e',
  overdue: '#ef4444',
  productivity: '#8b5cf6',
  projects: '#f59e0b'
}

export function TimelineAnalyticsDashboard({ 
  className 
}: TimelineAnalyticsDashboardProps) {
  const { tasks } = useTaskStore()
  const projects = useProjectsArray()
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [viewType, setViewType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Timeline data generation
  const timelineData = useMemo(() => {
    const tasksArray = tasks || []
    const projectsArray = projects || []
    
    const now = new Date()
    const startDate = new Date()
    
    // Time range ayarı
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const data: TimelineDataPoint[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 1)
      
      // O gün oluşturulan görevler
      const tasksCreatedOnDate = tasksArray.filter(task => {
        const createdDate = new Date(task.createdAt).toISOString().split('T')[0]
        return createdDate === dateStr
      }).length

      // O gün tamamlanan görevler
      const tasksCompletedOnDate = tasksArray.filter(task => {
        const completedDate = task.completedAt ? new Date(task.completedAt).toISOString().split('T')[0] : null
        return task.completed && completedDate === dateStr
      }).length

      // O gün süresi geçen görevler
      const tasksOverdueOnDate = tasksArray.filter(task => {
        if (task.completed || !task.dueDate) return false
        const dueDate = new Date(task.dueDate).toISOString().split('T')[0]
        return dueDate === dateStr
      }).length

      // O güne kadar toplam görev sayısı
      const totalTasksUpToDate = tasksArray.filter(task => {
        const createdDate = new Date(task.createdAt)
        return createdDate <= currentDate
      }).length

      // O güne kadar tamamlanan görevler
      const completedTasksUpToDate = tasksArray.filter(task => {
        const createdDate = new Date(task.createdAt)
        const completedDate = task.completedAt ? new Date(task.completedAt) : null
        return task.completed && createdDate <= currentDate && (!completedDate || completedDate <= currentDate)
      }).length

      // Completion rate
      const completionRate = totalTasksUpToDate > 0 
        ? Math.round((completedTasksUpToDate / totalTasksUpToDate) * 100)
        : 0

      // Productivity score (basit hesaplama)
      const productivity = Math.min(100, 
        (tasksCompletedOnDate * 20) + 
        (completionRate * 0.5) - 
        (tasksOverdueOnDate * 10)
      )

      // Aktif projeler (o güne kadar görevleri olan projeler)
      const activeProjectsUpToDate = [...new Set(
        tasksArray
          .filter(task => new Date(task.createdAt) <= currentDate)
          .map(task => task.project?.id)
          .filter(Boolean)
      )].length

      // Date label formatı
      let dateLabel: string
      if (timeRange === '7d') {
        dateLabel = currentDate.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
      } else if (timeRange === '30d') {
        dateLabel = currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      } else {
        dateLabel = currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      }

      data.push({
        date: dateStr,
        dateLabel,
        tasksCreated: tasksCreatedOnDate,
        tasksCompleted: tasksCompletedOnDate,
        tasksOverdue: tasksOverdueOnDate,
        totalTasks: totalTasksUpToDate,
        completionRate,
        productivity: Math.max(0, productivity),
        activeProjects: activeProjectsUpToDate
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return data
  }, [tasks, projects, timeRange])

  // Period comparison
  const periodComparison = useMemo((): PeriodComparison => {
    const tasksArray = tasks || []
    const now = new Date()
    
    // Current period
    let currentStart = new Date()
    let previousStart = new Date()
    let previousEnd = new Date()
    
    switch (timeRange) {
      case '7d':
        currentStart.setDate(now.getDate() - 7)
        previousStart.setDate(now.getDate() - 14)
        previousEnd.setDate(now.getDate() - 7)
        break
      case '30d':
        currentStart.setDate(now.getDate() - 30)
        previousStart.setDate(now.getDate() - 60)
        previousEnd.setDate(now.getDate() - 30)
        break
      case '90d':
        currentStart.setDate(now.getDate() - 90)
        previousStart.setDate(now.getDate() - 180)
        previousEnd.setDate(now.getDate() - 90)
        break
      case '1y':
        currentStart.setFullYear(now.getFullYear() - 1)
        previousStart.setFullYear(now.getFullYear() - 2)
        previousEnd.setFullYear(now.getFullYear() - 1)
        break
    }

    // Current period stats
    const currentTasks = tasksArray.filter(task => {
      const createdDate = new Date(task.createdAt)
      return createdDate >= currentStart && createdDate <= now
    })
    
    const currentCompletedTasks = currentTasks.filter(task => task.completed)
    const currentCompletionRate = currentTasks.length > 0 
      ? Math.round((currentCompletedTasks.length / currentTasks.length) * 100)
      : 0
    
    // Previous period stats  
    const previousTasks = tasksArray.filter(task => {
      const createdDate = new Date(task.createdAt)
      return createdDate >= previousStart && createdDate <= previousEnd
    })
    
    const previousCompletedTasks = previousTasks.filter(task => task.completed)
    const previousCompletionRate = previousTasks.length > 0 
      ? Math.round((previousCompletedTasks.length / previousTasks.length) * 100)
      : 0

    // Average completion time hesaplama
    const getCurrentAvgTime = (tasks: any[]) => {
      const completedWithDates = tasks.filter(task => 
        task.completed && task.createdAt && task.completedAt
      )
      if (completedWithDates.length === 0) return 0
      
      const totalTime = completedWithDates.reduce((acc, task) => {
        const created = new Date(task.createdAt!)
        const completed = new Date(task.completedAt!)
        return acc + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }, 0)
      
      return Math.round((totalTime / completedWithDates.length) * 10) / 10
    }

    const currentAvgTime = getCurrentAvgTime(currentTasks)
    const previousAvgTime = getCurrentAvgTime(previousTasks)

    // Productivity hesaplama
    const currentProductivity = Math.min(100, 
      (currentCompletionRate * 0.7) + 
      (Math.max(0, 10 - currentAvgTime) * 3)
    )
    
    const previousProductivity = Math.min(100, 
      (previousCompletionRate * 0.7) + 
      (Math.max(0, 10 - previousAvgTime) * 3)
    )

    return {
      current: {
        period: timeRange === '7d' ? 'Son 7 gün' : timeRange === '30d' ? 'Son 30 gün' : timeRange === '90d' ? 'Son 90 gün' : 'Son 1 yıl',
        tasksCompleted: currentCompletedTasks.length,
        completionRate: currentCompletionRate,
        avgCompletionTime: currentAvgTime,
        productivity: Math.round(currentProductivity)
      },
      previous: {
        period: timeRange === '7d' ? 'Önceki 7 gün' : timeRange === '30d' ? 'Önceki 30 gün' : timeRange === '90d' ? 'Önceki 90 gün' : 'Önceki 1 yıl',
        tasksCompleted: previousCompletedTasks.length,
        completionRate: previousCompletionRate,
        avgCompletionTime: previousAvgTime,
        productivity: Math.round(previousProductivity)
      },
      changes: {
        tasksCompleted: currentCompletedTasks.length - previousCompletedTasks.length,
        completionRate: currentCompletionRate - previousCompletionRate,
        avgCompletionTime: currentAvgTime - previousAvgTime,
        productivity: Math.round(currentProductivity - previousProductivity)
      }
    }
  }, [tasks, timeRange])

  // Overall timeline stats
  const timelineStats = useMemo(() => {
    const latestData = timelineData[timelineData.length - 1]
    const totalCreated = timelineData.reduce((acc, d) => acc + d.tasksCreated, 0)
    const totalCompleted = timelineData.reduce((acc, d) => acc + d.tasksCompleted, 0)
    const totalOverdue = timelineData.reduce((acc, d) => acc + d.tasksOverdue, 0)
    const avgProductivity = timelineData.length > 0 
      ? Math.round(timelineData.reduce((acc, d) => acc + d.productivity, 0) / timelineData.length)
      : 0
    const peakProductivityDay = timelineData.reduce((max, current) => 
      current.productivity > max.productivity ? current : max, 
      timelineData[0] || { productivity: 0, dateLabel: '' }
    )

    return {
      totalCreated,
      totalCompleted,
      totalOverdue,
      avgProductivity,
      currentTotalTasks: latestData?.totalTasks || 0,
      currentCompletionRate: latestData?.completionRate || 0,
      currentActiveProjects: latestData?.activeProjects || 0,
      peakProductivityDay: peakProductivityDay?.dateLabel || 'N/A'
    }
  }, [timelineData])

  const formatChangeIndicator = (value: number, suffix: string = '') => {
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-xs">
          <ArrowUp className="h-3 w-3" />
          +{value}{suffix}
        </span>
      )
    } else if (value < 0) {
      return (
        <span className="flex items-center gap-1 text-red-600 text-xs">
          <ArrowDown className="h-3 w-3" />
          {value}{suffix}
        </span>
      )
    } else {
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Minus className="h-3 w-3" />
          Değişim yok
        </span>
      )
    }
  }

  if (timelineData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Henüz zaman çizelgesi verisi yok</h3>
            <p className="text-muted-foreground">
              Zaman analizi için görev geçmişi oluşturun
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
          <h2 className="text-2xl font-bold tracking-tight">Zaman Çizelgesi Analizi</h2>
          <p className="text-muted-foreground">
            Zaman içindeki performans trendlerinizi ve değişimlerinizi analiz edin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
              <SelectItem value="90d">Son 90 gün</SelectItem>
              <SelectItem value="1y">Son 1 yıl</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Period Karşılaştırma Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Görev</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodComparison.current.tasksCompleted}</div>
            {formatChangeIndicator(periodComparison.changes.tasksCompleted)}
            <p className="text-xs text-muted-foreground mt-1">
              Önceki dönem: {periodComparison.previous.tasksCompleted}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanma Oranı</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{periodComparison.current.completionRate}</div>
            {formatChangeIndicator(periodComparison.changes.completionRate, '%')}
            <Progress value={periodComparison.current.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodComparison.current.avgCompletionTime}g</div>
            {formatChangeIndicator(-periodComparison.changes.avgCompletionTime, 'g')} {/* Negatif çünkü daha az süre daha iyi */}
            <p className="text-xs text-muted-foreground mt-1">
              Önceki: {periodComparison.previous.avgCompletionTime}g
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verimlilik Skoru</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodComparison.current.productivity}</div>
            {formatChangeIndicator(periodComparison.changes.productivity)}
            <p className="text-xs text-muted-foreground mt-1">
              Önceki: {periodComparison.previous.productivity}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana Timeline Grafikleri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Görev Aktivitesi Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Görev Aktivitesi</CardTitle>
            <CardDescription>
              Günlük görev oluşturma ve tamamlama trendi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateLabel" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasksCreated" 
                  stroke={CHART_COLORS.created}
                  name="Oluşturulan"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasksCompleted" 
                  stroke={CHART_COLORS.completed}
                  name="Tamamlanan"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasksOverdue" 
                  stroke={CHART_COLORS.overdue}
                  name="Süresi Geçen"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Verimlilik Trendi */}
        <Card>
          <CardHeader>
            <CardTitle>Verimlilik Trendi</CardTitle>
            <CardDescription>
              Günlük verimlilik skoru değişimi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateLabel" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm" style={{ color: CHART_COLORS.productivity }}>
                            Verimlilik: {payload[0].value}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="productivity"
                  stroke={CHART_COLORS.productivity}
                  fill={CHART_COLORS.productivity}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tamamlanma Oranı Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tamamlanma Oranı Gelişimi</CardTitle>
          <CardDescription>
            Zaman içinde genel tamamlanma oranının değişimi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateLabel" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-md">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          Tamamlanma Oranı: <span className="font-medium">%{data.completionRate}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Toplam Görev: <span className="font-medium">{data.totalTasks}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Aktif Projeler: <span className="font-medium">{data.activeProjects}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="completionRate"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.2}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Özet İstatistikler */}
      <Card>
        <CardHeader>
          <CardTitle>Dönem Özeti</CardTitle>
          <CardDescription>
            Seçilen zaman aralığındaki genel performans özeti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{timelineStats.totalCreated}</div>
              <p className="text-sm text-muted-foreground">Toplam Oluşturulan</p>
            </div>
            
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{timelineStats.totalCompleted}</div>
              <p className="text-sm text-muted-foreground">Toplam Tamamlanan</p>
            </div>
            
            <div className="text-center p-4 bg-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{timelineStats.avgProductivity}</div>
              <p className="text-sm text-muted-foreground">Ortalama Verimlilik</p>
            </div>
            
            <div className="text-center p-4 bg-orange-500/10 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{timelineStats.peakProductivityDay}</div>
              <p className="text-sm text-muted-foreground">En Verimli Gün</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}