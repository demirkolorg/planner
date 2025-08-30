"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionAnalyticsDashboard } from "@/components/analytics/section-analytics-dashboard"
import { ProjectAnalyticsDashboard } from "@/components/analytics/project-analytics-dashboard"
import { TeamAnalyticsDashboard } from "@/components/analytics/team-analytics-dashboard"
import { TimelineAnalyticsDashboard } from "@/components/analytics/timeline-analytics-dashboard"
import { BarChart3, TrendingUp, Users, Target, Calendar } from "lucide-react"
import { useProjectsArray } from "@/hooks/use-projects-migration"
import { useProjectStore } from "@/store/projectStore"

export default function AnalyticsPage() {
  const [selectedProject, setSelectedProject] = useState<string | undefined>(undefined)
  const projects = useProjectsArray()
  const { fetchSections } = useProjectStore()
  
  // Projects'lar yüklendiğinde sections'ları da yükle
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Her proje için sections'ları fetch et
      projects.forEach(project => {
        fetchSections(project.id).catch(console.error)
      })
    }
  }, [projects, fetchSections])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground font-medium">
              Proje ve bölüm performansınızı analiz edin
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Bölümler
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Projeler
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Takımlar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Zaman Çizelgesi
          </TabsTrigger>
        </TabsList>

        {/* Section Analytics */}
        <TabsContent value="sections" className="space-y-6">
          <SectionAnalyticsDashboard />
        </TabsContent>

        {/* Project Analytics */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectAnalyticsDashboard />
        </TabsContent>

        {/* Team Analytics */}
        <TabsContent value="teams" className="space-y-6">
          <TeamAnalyticsDashboard />
        </TabsContent>

        {/* Timeline Analytics */}
        <TabsContent value="timeline" className="space-y-6">
          <TimelineAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}