"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  AreaChart,
  Area
} from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  UserX,
  Target,
  Activity,
  Mail,
  Calendar,
  Award,
  Star
} from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectsArray } from "@/hooks/use-projects-migration"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

// Team member metrics
export interface TeamMemberMetrics {
  userId: string
  userName: string
  userEmail: string
  userInitials: string
  assignedTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number
  productivityScore: number
  recentActivity: number
  projectsWorkedOn: string[]
  lastActivityDate?: string
  isCurrentUser: boolean
  collaborationScore: number // Diğer üyelerle işbirliği skoru
}

interface TeamAnalyticsDashboardProps {
  className?: string
}

const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
]

export function TeamAnalyticsDashboard({ 
  className 
}: TeamAnalyticsDashboardProps) {
  const { tasks } = useTaskStore()
  const projects = useProjectsArray()
  const { user: currentUser } = useAuthStore()
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [sortBy, setSortBy] = useState<'productivity' | 'tasks' | 'completion' | 'collaboration'>('productivity')

  // Team members'ı task assignment'lardan çıkar
  const teamMetrics = useMemo(() => {
    const tasksArray = tasks || []
    const projectsArray = projects || []
    
    // Tüm unique kullanıcıları bul (task yaratanlar + assignment'lar)
    const allUsers = new Map<string, {
      id: string
      name: string
      email: string
      initials: string
    }>()

    // Task sahiplerini ekle
    tasksArray.forEach(task => {
      if (task.user) {
        const name = `${task.user.firstName} ${task.user.lastName}`.trim()
        allUsers.set(task.user.id, {
          id: task.user.id,
          name: name || task.user.email,
          email: task.user.email,
          initials: name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : task.user.email.slice(0, 2).toUpperCase()
        })
      }
    })

    // Assignment'lardaki kullanıcıları ekle
    tasksArray.forEach(task => {
      task.assignments?.forEach(assignment => {
        if (assignment.user && assignment.status === 'ACTIVE') {
          const name = `${assignment.user.firstName} ${assignment.user.lastName}`.trim()
          allUsers.set(assignment.user.id, {
            id: assignment.user.id,
            name: name || assignment.user.email,
            email: assignment.user.email,
            initials: name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : assignment.user.email.slice(0, 2).toUpperCase()
          })
        }
      })
    })

    // Current user'ı da ekle eğer yoksa
    if (currentUser) {
      const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`.trim()
      if (!allUsers.has(currentUser.id)) {
        allUsers.set(currentUser.id, {
          id: currentUser.id,
          name: currentUserName || currentUser.email,
          email: currentUser.email,
          initials: currentUserName ? currentUserName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : currentUser.email.slice(0, 2).toUpperCase()
        })
      }
    }

    // Her kullanıcı için metrikleri hesapla
    const metrics: TeamMemberMetrics[] = Array.from(allUsers.values()).map(user => {
      // Kullanıcının sahip olduğu görevler
      const ownedTasks = tasksArray.filter(task => task.user?.id === user.id)
      
      // Kullanıcıya assign edilmiş görevler
      const assignedTasks = tasksArray.filter(task => 
        task.assignments?.some(a => a.user?.id === user.id && a.status === 'ACTIVE')
      )
      
      // Toplam görevler (sahip olunan + assign edilenler, duplicateları çıkar)
      const allUserTasks = [...ownedTasks]
      assignedTasks.forEach(task => {
        if (!allUserTasks.find(t => t.id === task.id)) {
          allUserTasks.push(task)
        }
      })

      const completedTasks = allUserTasks.filter(task => task.completed).length
      const pendingTasks = allUserTasks.length - completedTasks
      
      // Overdue tasks
      const now = new Date()
      const overdueTasks = allUserTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        new Date(task.dueDate) < now
      ).length

      // Completion rate
      const completionRate = allUserTasks.length > 0 
        ? Math.round((completedTasks / allUserTasks.length) * 100)
        : 0

      // Average completion time
      const completedWithDates = allUserTasks.filter(task => 
        task.completed && task.createdAt && task.completedAt
      )
      const averageCompletionTime = completedWithDates.length > 0
        ? completedWithDates.reduce((acc, task) => {
            const created = new Date(task.createdAt!)
            const completed = new Date(task.completedAt!)
            return acc + Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          }, 0) / completedWithDates.length
        : 0

      // Productivity score
      const taskVolumeScore = Math.min(100, allUserTasks.length * 3)
      const timeScore = averageCompletionTime > 0 ? Math.max(0, 100 - averageCompletionTime * 2) : 50
      const productivityScore = Math.round((completionRate * 0.6) + (timeScore * 0.2) + (taskVolumeScore * 0.2))

      // Recent activity
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentActivity = allUserTasks.filter(task => 
        new Date(task.updatedAt) > sevenDaysAgo
      ).length

      // Projects worked on
      const projectsWorkedOn = [...new Set(allUserTasks.map(task => task.project?.id).filter(Boolean))]

      // Last activity date
      const lastActivityDate = allUserTasks.length > 0 
        ? allUserTasks.reduce((latest, task) => {
            const taskDate = new Date(task.updatedAt)
            return taskDate > latest ? taskDate : latest
          }, new Date(0))
        : undefined

      // Collaboration score (basit hesaplama: çalıştığı proje sayısı + assignment sayısı)
      const collaborationScore = Math.min(100, 
        (projectsWorkedOn.length * 20) + (assignedTasks.length * 5)
      )

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userInitials: user.initials,
        assignedTasks: allUserTasks.length,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
        productivityScore,
        recentActivity,
        projectsWorkedOn,
        lastActivityDate: lastActivityDate?.toISOString(),
        isCurrentUser: user.id === currentUser?.id,
        collaborationScore
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'productivity':
          return b.productivityScore - a.productivityScore
        case 'tasks':
          return b.assignedTasks - a.assignedTasks
        case 'completion':
          return b.completionRate - a.completionRate
        case 'collaboration':
          return b.collaborationScore - a.collaborationScore
        default:
          return b.productivityScore - a.productivityScore
      }
    })

    return metrics
  }, [tasks, projects, currentUser, sortBy])

  // Chart data
  const chartData = useMemo(() => {
    return teamMetrics.map(metric => ({
      name: metric.userName.length > 12 
        ? metric.userName.substring(0, 10) + '...'
        : metric.userName,
      fullName: metric.userName,
      email: metric.userEmail,
      completionRate: metric.completionRate,
      totalTasks: metric.assignedTasks,
      completedTasks: metric.completedTasks,
      productivityScore: metric.productivityScore,
      collaborationScore: metric.collaborationScore,
      recentActivity: metric.recentActivity,
      isCurrentUser: metric.isCurrentUser
    }))
  }, [teamMetrics])

  // Overall team stats
  const teamStats = useMemo(() => {
    const totalMembers = teamMetrics.length
    const activeMembers = teamMetrics.filter(m => m.recentActivity > 0).length
    const totalTasks = teamMetrics.reduce((acc, m) => acc + m.assignedTasks, 0)
    const totalCompleted = teamMetrics.reduce((acc, m) => acc + m.completedTasks, 0)
    const totalOverdue = teamMetrics.reduce((acc, m) => acc + m.overdueTasks, 0)
    const averageProductivity = totalMembers > 0 
      ? Math.round(teamMetrics.reduce((acc, m) => acc + m.productivityScore, 0) / totalMembers)
      : 0
    const topPerformers = teamMetrics.filter(m => m.productivityScore > 75).length
    const totalProjects = [...new Set(teamMetrics.flatMap(m => m.projectsWorkedOn))].length

    return {
      totalMembers,
      activeMembers,
      totalTasks,
      totalCompleted,
      totalOverdue,
      averageProductivity,
      topPerformers,
      totalProjects
    }
  }, [teamMetrics])

  if (teamMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Henüz takım analiz verisi yok</h3>
            <p className="text-muted-foreground">
              Takım analizi için görevlere üye atamaları yapın
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
          <h2 className="text-2xl font-bold tracking-tight">Takım Performans Analizi</h2>
          <p className="text-muted-foreground">
            Takım üyelerinizin performansını ve işbirliğini analiz edin
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: 'productivity' | 'tasks' | 'completion' | 'collaboration') => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="productivity">Verimlilik</SelectItem>
              <SelectItem value="tasks">Görev Sayısı</SelectItem>
              <SelectItem value="completion">Tamamlanma</SelectItem>
              <SelectItem value="collaboration">İşbirliği</SelectItem>
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

      {/* Genel Takım İstatistikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Takım Üyeleri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {teamStats.activeMembers} aktif üye
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {teamStats.totalCompleted} tamamlanan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Verimlilik</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.averageProductivity}</div>
            <Progress value={teamStats.averageProductivity} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yüksek Performanslı</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.topPerformers}</div>
            <p className="text-xs text-muted-foreground">
              %{Math.round((teamStats.topPerformers / teamStats.totalMembers) * 100)} üye
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ana Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Üye Performans Karşılaştırması */}
        <Card>
          <CardHeader>
            <CardTitle>Üye Performans Skorları</CardTitle>
            <CardDescription>
              Takım üyelerinin genel performans puanları
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
                            Performans: <span className="font-medium">{data.productivityScore}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Görevler: {data.completedTasks}/{data.totalTasks}
                          </p>
                          {data.isCurrentUser && (
                            <Badge className="mt-1 text-xs">Siz</Badge>
                          )}
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

        {/* İşbirliği Skorları */}
        <Card>
          <CardHeader>
            <CardTitle>İşbirliği Skorları</CardTitle>
            <CardDescription>
              Takım üyelerinin işbirliği seviyesi
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
                            İşbirliği Skoru: <span className="font-medium">{data.collaborationScore}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="collaborationScore" 
                  fill="#82ca9d"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Üye Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Takım Üye Detayları</CardTitle>
          <CardDescription>
            Her takım üyesinin detaylı performans metrikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMetrics.map((member, index) => (
              <div 
                key={member.userId}
                className={cn(
                  "flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors",
                  member.isCurrentUser && "bg-primary/5 border-primary/20"
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {member.userInitials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{member.userName}</h4>
                      {member.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          Siz
                        </Badge>
                      )}
                      {index < 3 && (
                        <Badge className="text-xs">
                          🏆 Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{member.userEmail}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {member.completedTasks}/{member.assignedTasks}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {member.averageCompletionTime}g ort.
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {member.projectsWorkedOn.length} proje
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {member.recentActivity} son aktivite
                      </span>
                      {member.overdueTasks > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {member.overdueTasks} gecikmiş
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Tamamlanma Progress */}
                  <div className="w-24">
                    <Progress value={member.completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      %{member.completionRate}
                    </p>
                  </div>

                  {/* Performance Score */}
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {member.productivityScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Performans
                    </div>
                  </div>

                  {/* Collaboration Score */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {member.collaborationScore}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      İşbirliği
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