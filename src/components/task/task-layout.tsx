"use client"

import { useState } from "react"
import { TaskDetailsPanel } from "./task-details-panel"
import { TaskContentPanel } from "./task-content-panel"
import { TaskActivityPanel } from "./task-activity-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, FileText, MessageCircle } from "lucide-react"

interface TaskLayoutProps {
  task: any
  onTaskUpdate: (task: any) => void
}

export function TaskLayout({ task, onTaskUpdate }: TaskLayoutProps) {
  const [activeTab, setActiveTab] = useState("content")

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
      {/* Desktop Layout (3 columns) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6">
        {/* Sol Panel - Details */}
        <div className="lg:col-span-3">
          <TaskDetailsPanel task={task} onTaskUpdate={onTaskUpdate} />
        </div>

        {/* Merkez Panel - Content */}
        <div className="lg:col-span-6">
          <TaskContentPanel task={task} onTaskUpdate={onTaskUpdate} />
        </div>

        {/* Sağ Panel - Activity */}
        <div className="lg:col-span-3">
          <TaskActivityPanel task={task} onTaskUpdate={onTaskUpdate} />
        </div>
      </div>

      {/* Mobile/Tablet Layout (Tabs) */}
      <div className="lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">İçerik</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Detaylar</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Aktivite</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <TaskContentPanel task={task} onTaskUpdate={onTaskUpdate} />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <TaskDetailsPanel task={task} onTaskUpdate={onTaskUpdate} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <TaskActivityPanel task={task} onTaskUpdate={onTaskUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}