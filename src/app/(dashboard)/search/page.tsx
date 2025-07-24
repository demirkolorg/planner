"use client"

import { useState } from "react"
import { Search, Calendar, Flag, Sun, Folder, Tag, ChevronDown, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { TaskCard } from "@/components/task/task-card"
import { NewTaskModal } from "@/components/modals/new-task-modal"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"
import Link from "next/link"

type ViewMode = 'simple' | 'detailed'
type ResultViewMode = 'simple' | 'project' | 'tag' | 'priority'

export default function SearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('simple')
  const [resultViewMode, setResultViewMode] = useState<ResultViewMode>('simple')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Task[]>([])
  
  // Detailed search filters
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({})
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalContext, setTaskModalContext] = useState<{
    project?: { id: string; name: string; emoji?: string }
    section?: { id: string; name: string; projectId: string }
    parentTaskId?: string
    parentTaskTitle?: string
  }>({})
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; subTaskCount: number } | null>(null)
  const [isTaskMoveModalOpen, setIsTaskMoveModalOpen] = useState(false)
  const [taskToMove, setTaskToMove] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isTaskCloneModalOpen, setIsTaskCloneModalOpen] = useState(false)
  const [taskToClone, setTaskToClone] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [editingTask, setEditingTask] = useState<any | null>(null)

  const { 
    tasks,
    toggleTaskComplete,
    updateTask,
    deleteTask,
    toggleTaskPin,
    updateTaskTags,
    updateTaskReminders,
    addSubTask,
    cloneTask,
    moveTask,
  } = useTaskStore()
  
  const { projects } = useProjectStore()
  const { tags } = useTagStore()

  // Simple search function
  const performSimpleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    
    setSearchResults(filtered)
  }

  // Detailed search function
  const performDetailedSearch = () => {
    let filtered = tasks

    // Title/description search
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Project filter
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(task => selectedProjects.includes(task.projectId))
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(task => 
        task.tags && task.tags.some(taskTag => selectedTags.includes(taskTag.tagId))
      )
    }

    // Priority filter
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(task => selectedPriorities.includes(task.priority))
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        
        if (dateRange.from && dateRange.to) {
          return taskDate >= dateRange.from && taskDate <= dateRange.to
        } else if (dateRange.from) {
          return taskDate >= dateRange.from
        } else if (dateRange.to) {
          return taskDate <= dateRange.to
        }
        
        return true
      })
    }

    setSearchResults(filtered)
  }

  const handleSearch = () => {
    if (viewMode === 'simple') {
      performSimpleSearch()
    } else {
      performDetailedSearch()
    }
  }

  // Task handlers
  const handleDeleteTask = (taskId: string) => {
    const task = searchResults.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ 
        id: taskId, 
        title: task.title,
        subTaskCount: subTaskCount
      })
      setIsTaskDeleteDialogOpen(true)
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task)
    setTaskModalContext({
      project: task.project ? { id: task.project.id, name: task.project.name, emoji: task.project.emoji } : undefined,
      section: task.section ? { id: task.section.id, name: task.section.name, projectId: task.projectId } : undefined
    })
    setIsTaskModalOpen(true)
  }

  const handleAddSubTask = (parentTaskId: string) => {
    const parentTask = searchResults.find(t => t.id === parentTaskId)
    const project = parentTask ? projects.find(p => p.id === parentTask.projectId) : null
    
    const section = parentTask?.sectionId ? {
      id: parentTask.sectionId,
      name: 'Varsayılan',
      projectId: parentTask.projectId
    } : {
      id: 'default',
      name: 'Varsayılan',
      projectId: project?.id || ''
    }
    
    setTaskModalContext({
      project: project ? { id: project.id, name: project.name, emoji: project.emoji } : undefined,
      section: section,
      parentTaskId: parentTaskId,
      parentTaskTitle: parentTask?.title
    })
    setIsTaskModalOpen(true)
  }

  const priorities = [
    { value: 'CRITICAL', label: 'Kritik', color: '#dc2626' },
    { value: 'HIGH', label: 'Yüksek', color: '#ea580c' },
    { value: 'MEDIUM', label: 'Orta', color: '#ca8a04' },
    { value: 'LOW', label: 'Düşük', color: '#16a34a' },
    { value: 'NONE', label: 'Yok', color: '#6b7280' }
  ]

  // Görünüm modları için gruplama fonksiyonları
  const groupTasksByProject = () => {
    const grouped: Record<string, {
      project: { id?: string; name: string; emoji?: string }
      tasks: Task[]
    }> = {}
    searchResults.forEach(task => {
      const project = projects.find(p => p.id === task.projectId)
      const projectName = project?.name || 'Bilinmeyen Proje'
      if (!grouped[projectName]) {
        grouped[projectName] = {
          project: project || { name: projectName, emoji: '📁' },
          tasks: []
        }
      }
      grouped[projectName].tasks.push(task)
    })
    return grouped
  }

  const groupTasksByTag = () => {
    const grouped: Record<string, {
      tag: { id?: string; name: string; color: string }
      tasks: Task[]
    }> = {}
    searchResults.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach((taskTag: { tag: { id: string; name: string; color: string } }) => {
          const tagName = taskTag.tag.name
          if (!grouped[tagName]) {
            grouped[tagName] = {
              tag: taskTag.tag,
              tasks: []
            }
          }
          grouped[tagName].tasks.push(task)
        })
      } else {
        if (!grouped['Etiketsiz']) {
          grouped['Etiketsiz'] = {
            tag: { name: 'Etiketsiz', color: '#6b7280' },
            tasks: []
          }
        }
        grouped['Etiketsiz'].tasks.push(task)
      }
    })
    return grouped
  }

  const groupTasksByPriority = () => {
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
    const priorityNames = {
      'CRITICAL': 'Kritik',
      'HIGH': 'Yüksek', 
      'MEDIUM': 'Orta',
      'LOW': 'Düşük',
      'NONE': 'Önceliksiz'
    }
    
    const grouped: Record<string, {
      priority: string
      tasks: Task[]
    }> = {}
    priorityOrder.forEach(priority => {
      const tasksWithPriority = searchResults.filter(task => task.priority === priority)
      if (tasksWithPriority.length > 0) {
        grouped[priority] = {
          priority: priorityNames[priority as keyof typeof priorityNames],
          tasks: tasksWithPriority
        }
      }
    })
    return grouped
  }

  return (
    <div className="space-y-6">
      {/* Header with View Modes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Search className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent">
                Arama
              </h1>
              <p className="text-muted-foreground">
                {searchResults.length > 0 ? `${searchResults.length} sonuç bulundu` : 'Görevlerde arama yapın'}
              </p>
            </div>
          </div>
          
          {/* View Mode Navigation - Right Aligned */}
          <div className="flex items-center space-x-1 bg-muted/50 border border-border rounded-xl p-1">
            <Button
              variant={viewMode === 'simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('simple')}
              className="h-8 px-3 rounded-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Basit
            </Button>
            <Button
              variant={viewMode === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('detailed')}
              className="h-8 px-3 rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Detaylı
            </Button>
          </div>
        </div>

        {/* Result View Mode Navigation */}
        {searchResults.length > 0 && (
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-1 bg-muted/50 border border-border rounded-xl p-1">
              <Button
                variant={resultViewMode === 'simple' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setResultViewMode('simple')}
                className="h-8 px-3 rounded-lg"
              >
                <Sun className="h-4 w-4 mr-2" />
                Basit
              </Button>
              <Button
                variant={resultViewMode === 'project' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setResultViewMode('project')}
                className="h-8 px-3 rounded-lg"
              >
                <Folder className="h-4 w-4 mr-2" />
                Proje
              </Button>
              <Button
                variant={resultViewMode === 'priority' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setResultViewMode('priority')}
                className="h-8 px-3 rounded-lg"
              >
                <Flag className="h-4 w-4 mr-2" />
                Öncelik
              </Button>
              <Button
                variant={resultViewMode === 'tag' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setResultViewMode('tag')}
                className="h-8 px-3 rounded-lg"
              >
                <Tag className="h-4 w-4 mr-2" />
                Etiket
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search Controls */}
      {viewMode === 'simple' ? (
        /* Simple Search */
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Görev adı veya açıklamasında ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="text-lg h-14 px-6 text-base placeholder:text-base"
            />
          </div>
          <Button onClick={handleSearch} className="px-8 h-14 text-base">
            <Search className="h-5 w-5 mr-2" />
            Ara
          </Button>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6">
              /* Detailed Search */
              <div className="space-y-6">
                {/* Search Query */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Görev Adı / Açıklama</label>
                  <Input
                    placeholder="Aranacak kelimeler..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Project Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Projeler</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {projects.map(project => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`project-${project.id}`}
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProjects([...selectedProjects, project.id])
                              } else {
                                setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                              }
                            }}
                          />
                          <label htmlFor={`project-${project.id}`} className="text-sm">
                            {project.emoji} {project.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tag Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Etiketler</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tags.map(tag => (
                        <div key={tag.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTags.includes(tag.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTags([...selectedTags, tag.id])
                              } else {
                                setSelectedTags(selectedTags.filter(id => id !== tag.id))
                              }
                            }}
                          />
                          <label htmlFor={`tag-${tag.id}`} className="text-sm flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Öncelik</label>
                    <div className="space-y-2">
                      {priorities.map(priority => (
                        <div key={priority.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`priority-${priority.value}`}
                            checked={selectedPriorities.includes(priority.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPriorities([...selectedPriorities, priority.value])
                              } else {
                                setSelectedPriorities(selectedPriorities.filter(p => p !== priority.value))
                              }
                            }}
                          />
                          <label htmlFor={`priority-${priority.value}`} className="text-sm flex items-center">
                            <Flag 
                              className="w-3 h-3 mr-2" 
                              style={{ color: priority.color }}
                            />
                            {priority.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Bitiş Tarihi Aralığı</label>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="Başlangıç tarihi"
                        value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange({
                          ...dateRange, 
                          from: e.target.value ? new Date(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="Bitiş tarihi"
                        value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange({
                          ...dateRange, 
                          to: e.target.value ? new Date(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setDateRange({})}
                      disabled={!dateRange.from && !dateRange.to}
                    >
                      Temizle
                    </Button>
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSearch} className="px-8">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Ara
                  </Button>
                </div>
              </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {resultViewMode === 'simple' ? (
            // Basit görünüm - tüm sonuçlar liste halinde
            searchResults.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleTaskComplete}
                onUpdate={updateTask}
                onDelete={handleDeleteTask}
                onPin={toggleTaskPin}
                onCopy={(taskId) => {
                  const taskToClone = searchResults.find(t => t.id === taskId)
                  if (taskToClone) {
                    setTaskToClone({
                      id: taskId,
                      title: taskToClone.title,
                      projectId: taskToClone.projectId,
                      sectionId: taskToClone.sectionId
                    })
                    setIsTaskCloneModalOpen(true)
                  }
                }}
                onMove={(taskId) => {
                  const taskToMove = searchResults.find(t => t.id === taskId)
                  if (taskToMove) {
                    setTaskToMove({
                      id: taskId,
                      title: taskToMove.title,
                      projectId: taskToMove.projectId,
                      sectionId: taskToMove.sectionId
                    })
                    setIsTaskMoveModalOpen(true)
                  }
                }}
                onAddSubTask={handleAddSubTask}
                onUpdateTags={updateTaskTags}
                onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                onUpdateReminders={updateTaskReminders}
                onEdit={handleEditTask}
              />
            ))
          ) : resultViewMode === 'project' ? (
            // Proje görünümü - projelere göre gruplandırılmış
            Object.entries(groupTasksByProject()).map(([projectName, { project, tasks }]) => (
              <div key={projectName} className="space-y-3">
                {/* Proje Başlığı */}
                <div className="p-4 rounded-xl border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-lg">{project.emoji || '📁'}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tasks.length} görev
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Görevler */}
                <div className="space-y-2 pl-6">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleTaskComplete}
                      onUpdate={updateTask}
                      onDelete={handleDeleteTask}
                      onPin={toggleTaskPin}
                      onCopy={(taskId) => {
                        const taskToClone = searchResults.find(t => t.id === taskId)
                        if (taskToClone) {
                          setTaskToClone({
                            id: taskId,
                            title: taskToClone.title,
                            projectId: taskToClone.projectId,
                            sectionId: taskToClone.sectionId
                          })
                          setIsTaskCloneModalOpen(true)
                        }
                      }}
                      onMove={(taskId) => {
                        const taskToMove = searchResults.find(t => t.id === taskId)
                        if (taskToMove) {
                          setTaskToMove({
                            id: taskId,
                            title: taskToMove.title,
                            projectId: taskToMove.projectId,
                            sectionId: taskToMove.sectionId
                          })
                          setIsTaskMoveModalOpen(true)
                        }
                      }}
                      onAddSubTask={handleAddSubTask}
                      onUpdateTags={updateTaskTags}
                      onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                      onUpdateReminders={updateTaskReminders}
                      onEdit={handleEditTask}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : resultViewMode === 'tag' ? (
            // Etiket görünümü - etiketlere göre gruplandırılmış
            Object.entries(groupTasksByTag()).map(([tagName, { tag, tasks }]) => (
              <Collapsible key={tagName} defaultOpen={true}>
                <CollapsibleTrigger asChild>
                  <div className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-all duration-200 hover:shadow-sm cursor-pointer">
                    <div className="flex items-center space-x-2.5">
                      <div>
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center shadow-sm"
                          style={{ 
                            backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                            border: `1px solid ${tag.color ? tag.color + '40' : '#d1d5db'}`
                          }}
                        >
                          <Tag className="h-4 w-4" style={{ color: tag.color || '#6b7280' }} />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                          {tagName}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {tasks.length} görev
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {tag.id && (
                        <Link 
                          href={`/tags/${tag.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        </Link>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={toggleTaskComplete}
                      onUpdate={updateTask}
                      onDelete={handleDeleteTask}
                      onPin={toggleTaskPin}
                      onCopy={(taskId) => {
                        const taskToClone = searchResults.find(t => t.id === taskId)
                        if (taskToClone) {
                          setTaskToClone({
                            id: taskId,
                            title: taskToClone.title,
                            projectId: taskToClone.projectId,
                            sectionId: taskToClone.sectionId
                          })
                          setIsTaskCloneModalOpen(true)
                        }
                      }}
                      onMove={(taskId) => {
                        const taskToMove = searchResults.find(t => t.id === taskId)
                        if (taskToMove) {
                          setTaskToMove({
                            id: taskId,
                            title: taskToMove.title,
                            projectId: taskToMove.projectId,
                            sectionId: taskToMove.sectionId
                          })
                          setIsTaskMoveModalOpen(true)
                        }
                      }}
                      onAddSubTask={handleAddSubTask}
                      onUpdateTags={updateTaskTags}
                      onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                      onUpdateReminders={updateTaskReminders}
                      onEdit={handleEditTask}
                    />
                  ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          ) : (
            // Öncelik görünümü - önceliklere göre gruplandırılmış
            Object.entries(groupTasksByPriority()).map(([priorityKey, { priority, tasks }]) => {
              const priorityConfig = priorities.find(p => p.value === priorityKey)
              const priorityIcons = {
                'CRITICAL': '🔴',
                'HIGH': '🟠', 
                'MEDIUM': '🟡',
                'LOW': '🔵',
                'NONE': '⚪'
              }
              
              return (
                <Collapsible key={priorityKey} defaultOpen={true}>
                  <CollapsibleTrigger asChild>
                    <div className="group flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border hover:bg-muted/80 transition-all duration-200 hover:shadow-sm cursor-pointer">
                      <div className="flex items-center space-x-2.5">
                        <div>
                          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shadow-sm">
                            <span className="text-sm">{priorityIcons[priorityKey as keyof typeof priorityIcons]}</span>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-sm font-medium text-foreground">
                            {priority}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {tasks.length} görev
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={toggleTaskComplete}
                        onUpdate={updateTask}
                        onDelete={handleDeleteTask}
                        onPin={toggleTaskPin}
                        onCopy={(taskId) => {
                          const taskToClone = searchResults.find(t => t.id === taskId)
                          if (taskToClone) {
                            setTaskToClone({
                              id: taskId,
                              title: taskToClone.title,
                              projectId: taskToClone.projectId,
                              sectionId: taskToClone.sectionId
                            })
                            setIsTaskCloneModalOpen(true)
                          }
                        }}
                        onMove={(taskId) => {
                          const taskToMove = searchResults.find(t => t.id === taskId)
                          if (taskToMove) {
                            setTaskToMove({
                              id: taskId,
                              title: taskToMove.title,
                              projectId: taskToMove.projectId,
                              sectionId: taskToMove.sectionId
                            })
                            setIsTaskMoveModalOpen(true)
                          }
                        }}
                        onAddSubTask={handleAddSubTask}
                        onUpdateTags={updateTaskTags}
                        onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
                        onUpdateReminders={updateTaskReminders}
                        onEdit={handleEditTask}
                      />
                    ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      )}

      {/* Empty State */}
      {searchQuery && searchResults.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Sonuç bulunamadı</h3>
          <p className="text-sm text-muted-foreground">
            Arama kriterlerinize uygun görev bulunamadı. Farklı terimler deneyin.
          </p>
        </div>
      )}

      {/* Modals */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setTaskModalContext({})
          setEditingTask(null)
        }}
        projectContext={taskModalContext.project}
        sectionContext={taskModalContext.section}
        parentTaskId={taskModalContext.parentTaskId}
        parentTaskTitle={taskModalContext.parentTaskTitle}
        editingTask={editingTask}
      />

      <TaskDeleteDialog
        isOpen={isTaskDeleteDialogOpen}
        onClose={() => {
          setIsTaskDeleteDialogOpen(false)
          setTaskToDelete(null)
        }}
        onConfirm={() => {
          if (taskToDelete) {
            deleteTask(taskToDelete.id)
          }
        }}
        task={taskToDelete ? {
          id: taskToDelete.id,
          title: taskToDelete.title,
          subTasks: Array(taskToDelete.subTaskCount).fill({}).map((_, index) => ({
            id: `sub-${index}`,
            title: `Alt görev ${index + 1}`,
            completed: false
          }))
        } : null}
      />

      <MoveTaskModal
        isOpen={isTaskMoveModalOpen}
        onClose={() => {
          setIsTaskMoveModalOpen(false)
          setTaskToMove(null)
        }}
        onMove={(projectId, sectionId) => {
          if (taskToMove) {
            moveTask(taskToMove.id, projectId, sectionId)
          }
        }}
        currentProjectId={taskToMove?.projectId || ''}
        currentSectionId={taskToMove?.sectionId}
      />
    </div>
  )
}