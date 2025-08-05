"use client"

import { useState } from "react"
import { TaskCard } from "@/components/task/task-card"
import { TaskCommentsModal } from "@/components/modals/task-comments-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

// Available tags for testing
const availableTags = [
  { id: "tag-1", name: "Önemli", color: "#ef4444" },
  { id: "tag-2", name: "İş", color: "#3b82f6" },
  { id: "tag-3", name: "Kişisel", color: "#10b981" },
  { id: "tag-4", name: "Acil", color: "#f59e0b" },
  { id: "tag-5", name: "Proje", color: "#8b5cf6" },
  { id: "tag-6", name: "Toplantı", color: "#ec4899" },
  { id: "tag-7", name: "Araştırma", color: "#06b6d4" },
  { id: "tag-8", name: "Geliştirme", color: "#84cc16" },
]

// Mock task data for testing
const createMockTask = (overrides = {}) => ({
  id: "mock-task-1",
  title: "Example Task Title",
  description: "This is a sample task description to test how longer text appears in the task card.",
  completed: false,
  priority: "MEDIUM",
  dueDate: new Date().toISOString(),
  isPinned: false,
  parentTaskId: undefined,
  projectId: "project-1",
  sectionId: "section-1",
  userId: "user-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  level: 0,
  tags: [
    {
      id: "tag-1",
      taskId: "mock-task-1",
      tagId: "tag-id-1",
      tag: {
        id: "tag-id-1",
        name: "Önemli",
        color: "#ef4444"
      }
    },
    {
      id: "tag-2", 
      taskId: "mock-task-1",
      tagId: "tag-id-2",
      tag: {
        id: "tag-id-2",
        name: "İş",
        color: "#3b82f6"
      }
    }
  ],
    {
      id: "reminder-1",
      taskId: "mock-task-1",
      datetime: new Date(Date.now() + 86400000), // Tomorrow
      message: "Hatırlatıcı mesajı",
      isActive: true
    }
  ],
  subTasks: [
    {
      id: "sub-1",
      title: "Alt görev 1",
      completed: false,
      priority: "MEDIUM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "sub-2", 
      title: "Alt görev 2",
      completed: true,
      priority: "LOW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  ...overrides
})

// Generate multiple mock tasks with different properties
const generateMockTasks = () => {
  const priorities = ["HIGH", "MEDIUM", "LOW", "NONE"]
  const sampleTitles = [
    "Website redesign project",
    "Quarterly report preparation", 
    "Team meeting notes",
    "Bug fix for login system",
    "Research new technologies",
    "Customer feedback analysis",
    "Database optimization",
    "Mobile app testing",
    "Documentation update",
    "Code review session"
  ]
  
  const sampleDescriptions = [
    "Complete the redesign of the company website with new branding",
    "Prepare quarterly performance report with charts and analysis",
    "Take comprehensive notes during the weekly team meeting",
    "Fix critical bug affecting user login authentication",
    "Research and evaluate new frontend technologies for next project",
    "Analyze customer feedback and prepare improvement suggestions",
    "Optimize database queries to improve application performance",
    "Conduct thorough testing of mobile application features",
    "Update technical documentation with latest changes",
    "Review code changes and provide constructive feedback"
  ]

  return Array.from({ length: 10 }, (_, index) => {
    const priority = priorities[index % priorities.length]
    const hasDate = Math.random() > 0.3
    const isCompleted = Math.random() > 0.7
    const isPinned = Math.random() > 0.8
    const level = index < 2 ? 0 : index < 4 ? 1 : index < 6 ? 2 : 0
    
    // Random tag selection (1-3 tags per task)
    const shuffledTags = [...availableTags].sort(() => 0.5 - Math.random())
    const numTags = Math.floor(Math.random() * 3) + 1
    const selectedTags = shuffledTags.slice(0, numTags).map((tag, tagIndex) => ({
      id: `tag-${index}-${tagIndex}`,
      taskId: `mock-task-${index + 1}`,
      tagId: tag.id,
      tag: tag
    }))

    // Add sub-tasks to some tasks (30% chance)
    const hasSubTasks = Math.random() > 0.7
    const subTasks = hasSubTasks ? Array.from({ length: Math.floor(Math.random() * 4) + 2 }, (_, subIndex) => ({
      id: `sub-${index + 1}-${subIndex + 1}`,
      title: `${sampleTitles[index]} - Alt görev ${subIndex + 1}`,
      completed: Math.random() > 0.6,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) : []

    return createMockTask({
      id: `mock-task-${index + 1}`,
      title: sampleTitles[index],
      description: sampleDescriptions[index],
      priority,
      completed: isCompleted,
      isPinned,
      level,
      dueDate: hasDate ? new Date(Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      tags: selectedTags,
        id: `reminder-${index + 1}`,
        taskId: `mock-task-${index + 1}`,
        datetime: new Date(Date.now() + (Math.random() * 3 * 24 * 60 * 60 * 1000)),
        message: "Hatırlatıcı mesajı",
        isActive: true
      }] : [],
      subTasks: subTasks
    })
  })
}

export default function TasksPage() {
  // Task state controls (for single card preview)
  const [taskTitle] = useState("Example Task Title")
  const [taskDescription] = useState("This is a sample task description to test how longer text appears in the task card.")
  const [isCompleted, setIsCompleted] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [priority, setPriority] = useState("MEDIUM")
  const [hasDate, setHasDate] = useState(true)
  const [hasTags, setHasTags] = useState(true)
  const [hasReminders, setHasReminders] = useState(true)
  const [hasSubTasks, setHasSubTasks] = useState(true)
  const [taskLevel, setTaskLevel] = useState([0])
  const [longTitle, setLongTitle] = useState(false)
  const [longDescription, setLongDescription] = useState(false)

  // Multi-task view and filtering
  const [showMultipleCards, setShowMultipleCards] = useState(true)
  const [mockTasks] = useState(() => generateMockTasks())
  
  // Filter states
  const [searchText, setSearchText] = useState("")
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showCompleted, setShowCompleted] = useState(true)
  const [showPinned, setShowPinned] = useState(true)
  
  // Comment modal states
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [commentsModalTask, setCommentsModalTask] = useState<{ id: string; title: string; completed: boolean } | null>(null)

  // Create dynamic mock task based on controls
  const getMockTask = () => {
    const baseTask = createMockTask({
      title: longTitle 
        ? "Very Long Task Title That Should Test How The Task Card Handles Extremely Long Titles And Text Wrapping Behavior"
        : taskTitle,
      description: longDescription
        ? "This is a very long task description that should test how the task card handles lengthy descriptions and whether the text wrapping works correctly. It should help us see how the card expands and contracts based on content length. We want to make sure it looks good with lots of text and maintains proper spacing and readability."
        : taskDescription,
      completed: isCompleted,
      isPinned: isPinned,
      priority: priority,
      level: taskLevel[0],
      dueDate: hasDate ? new Date().toISOString() : undefined,
      tags: hasTags ? [
        {
          id: "tag-1",
          taskId: "mock-task-1", 
          tagId: "tag-id-1",
          tag: { id: "tag-id-1", name: "Önemli", color: "#ef4444" }
        },
        {
          id: "tag-2",
          taskId: "mock-task-1",
          tagId: "tag-id-2", 
          tag: { id: "tag-id-2", name: "İş", color: "#3b82f6" }
        }
      ] : [],
        {
          id: "reminder-1",
          taskId: "mock-task-1",
          datetime: new Date(Date.now() + 86400000),
          message: "Hatırlatıcı mesajı",
          isActive: true
        }
      ] : [],
      subTasks: hasSubTasks ? [
        {
          id: "sub-mock-1",
          title: "Test alt görev 1",
          completed: false,
          priority: "HIGH",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "sub-mock-2",
          title: "Test alt görev 2",
          completed: true,
          priority: "MEDIUM",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "sub-mock-3",
          title: "Test alt görev 3",
          completed: false,
          priority: "NONE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ] : []
    })

    return baseTask
  }

  const mockTask = getMockTask()

  // Handler functions
  const handleCommentTask = (taskId: string, taskTitle: string) => {
    // Mock task olduğu için completed durumunu mock task'tan al
    const task = mockTasks.find(t => t.id === taskId) || mockTask
    setCommentsModalTask({ id: taskId, title: taskTitle, completed: task.completed })
    setIsCommentsModalOpen(true)
  }

  // Filter function for multiple cards
  const getFilteredTasks = () => {
    return mockTasks.filter(task => {
      // Text search
      if (searchText && !task.title.toLowerCase().includes(searchText.toLowerCase()) && 
          !task.description?.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }

      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const taskTagNames = task.tags?.map(t => t.tag.name) || []
        if (!selectedTags.some(selectedTag => taskTagNames.includes(selectedTag))) {
          return false
        }
      }

      // Completed filter
      if (!showCompleted && task.completed) {
        return false
      }

      // Pinned filter
      if (!showPinned && task.isPinned) {
        return false
      }

      return true
    })
  }

  const filteredTasks = getFilteredTasks()

  // Handle priority filter toggle
  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    )
  }

  // Handle tag filter toggle
  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  // Mock handlers
  const handleToggleComplete = () => {
    setIsCompleted(!isCompleted)
  }

  const handleUpdate = (taskId: string, updates: Record<string, unknown>) => {
  }

  const handleDelete = (taskId: string) => {
  }

  const handlePin = () => {
    setIsPinned(!isPinned)
  }

  const handleAddSubTask = (parentTaskId: string) => {
  }

  const handleUpdateTags = (taskId: string, tags: string[]) => {
  }

  const handleUpdatePriority = (taskId: string, priority: string) => {
    setPriority(priority)
  }

  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Görev Kartı Test Sayfası</h1>
        <p className="text-muted-foreground">
          TaskCard componentinin çeşitli durumlarını test etmek ve tasarımını geliştirmek için kullanılır.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* View Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Görünüm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Çoklu Kart Görünümü</span>
                <Switch checked={showMultipleCards} onCheckedChange={setShowMultipleCards} />
              </div>
            </CardContent>
          </Card>

          {/* Filters (only for multiple card view) */}
          {showMultipleCards && (
            <Card>
              <CardHeader>
                <CardTitle>Filtreler ({filteredTasks.length}/{mockTasks.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <h4 className="font-medium">Arama</h4>
                  <Input
                    placeholder="Görev ara..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>

                {/* Priority Filters */}
                <div className="space-y-2">
                  <h4 className="font-medium">Öncelik</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["HIGH", "MEDIUM", "LOW", "NONE"].map(priority => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={selectedPriorities.includes(priority)}
                          onCheckedChange={() => togglePriority(priority)}
                        />
                        <label htmlFor={`priority-${priority}`} className="text-xs">
                          {priority === "HIGH" ? "Yüksek" : 
                           priority === "MEDIUM" ? "Orta" :
                           priority === "LOW" ? "Düşük" : "Yok"}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tag Filters */}
                <div className="space-y-2">
                  <h4 className="font-medium">Etiketler</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableTags.map(tag => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.name)}
                          onCheckedChange={() => toggleTag(tag.name)}
                        />
                        <label htmlFor={`tag-${tag.id}`} className="text-xs flex items-center space-x-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span>{tag.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filters */}
                <div className="space-y-3">
                  <h4 className="font-medium">Durum</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tamamlananları göster</span>
                    <Switch checked={showCompleted} onCheckedChange={setShowCompleted} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sabitlenenleri göster</span>
                    <Switch checked={showPinned} onCheckedChange={setShowPinned} />
                  </div>
                </div>

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSearchText("")
                    setSelectedPriorities([])
                    setSelectedTags([])
                    setShowCompleted(true)
                    setShowPinned(true)
                  }}
                >
                  Filtreleri Temizle
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Single Card Controls (only when not in multiple view) */}
          {!showMultipleCards && (
            <Card>
              <CardHeader>
                <CardTitle>Tek Kart Kontrolleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Basic States */}
              <div className="space-y-3">
                <h4 className="font-medium">Temel Durumlar</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tamamlandı</span>
                  <Switch checked={isCompleted} onCheckedChange={setIsCompleted} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sabitlendi</span>
                  <Switch checked={isPinned} onCheckedChange={setIsPinned} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tarih var</span>
                  <Switch checked={hasDate} onCheckedChange={setHasDate} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Etiketler var</span>
                  <Switch checked={hasTags} onCheckedChange={setHasTags} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hatırlatıcılar var</span>
                  <Switch checked={hasReminders} onCheckedChange={setHasReminders} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Alt görevler var</span>
                  <Switch checked={hasSubTasks} onCheckedChange={setHasSubTasks} />
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <h4 className="font-medium">Öncelik</h4>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Yok</SelectItem>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="MEDIUM">Orta</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Level */}
              <div className="space-y-2">
                <h4 className="font-medium">Seviye (Alt görev derinliği)</h4>
                <div className="px-2">
                  <Slider
                    value={taskLevel}
                    onValueChange={setTaskLevel}
                    max={4}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Ana (0)</span>
                    <span>Seviye {taskLevel[0]}</span>
                    <span>Max (4)</span>
                  </div>
                </div>
              </div>

              {/* Content Tests */}
              <div className="space-y-3">
                <h4 className="font-medium">İçerik Testleri</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uzun başlık</span>
                  <Switch checked={longTitle} onCheckedChange={setLongTitle} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uzun açıklama</span>
                  <Switch checked={longDescription} onCheckedChange={setLongDescription} />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <h4 className="font-medium">Hızlı Ayarlar</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCompleted(false)
                      setIsPinned(false)
                      setPriority("NONE")
                      setTaskLevel([0])
                      setHasDate(false)
                      setHasTags(false)
                      setHasReminders(false)
                      setHasSubTasks(false)
                      setLongTitle(false)
                      setLongDescription(false)
                    }}
                  >
                    Minimal
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCompleted(false)
                      setIsPinned(true)
                      setPriority("HIGH")
                      setTaskLevel([0])
                      setHasDate(true)
                      setHasTags(true)
                      setHasReminders(true)
                      setHasSubTasks(true)
                      setLongTitle(false)
                      setLongDescription(false)
                    }}
                  >
                    Tam Donanım
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCompleted(false)
                      setIsPinned(false)
                      setPriority("MEDIUM")
                      setTaskLevel([2])
                      setHasDate(true)
                      setHasTags(true)
                      setHasReminders(false)
                      setHasSubTasks(false)
                      setLongTitle(false)
                      setLongDescription(false)
                    }}
                  >
                    Alt Görev
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsCompleted(false)
                      setIsPinned(false)
                      setPriority("LOW")
                      setTaskLevel([0])
                      setHasDate(true)
                      setHasTags(false)
                      setHasReminders(false)
                      setHasSubTasks(false)
                      setLongTitle(true)
                      setLongDescription(true)
                    }}
                  >
                    Uzun İçerik
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Current State Info */}
          <Card>
            <CardHeader>
              <CardTitle>Mevcut Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {isCompleted && <Badge variant="secondary">Tamamlandı</Badge>}
                {isPinned && <Badge variant="secondary">Sabitlendi</Badge>}
                {hasDate && <Badge variant="secondary">Tarihli</Badge>}
                {hasTags && <Badge variant="secondary">Etiketli</Badge>}
                {hasReminders && <Badge variant="secondary">Hatırlatıcılı</Badge>}
                {hasSubTasks && <Badge variant="secondary">Alt Görevli</Badge>}
                {taskLevel[0] > 0 && <Badge variant="secondary">Seviye {taskLevel[0]}</Badge>}
                <Badge variant="outline">{priority}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Card Preview */}
        <div className="lg:col-span-2 space-y-4">
          {!showMultipleCards ? (
            <Card>
              <CardHeader>
                <CardTitle>Görev Kartı Önizlemesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-2xl">
                  <TaskCard
                    task={mockTask}
                    onToggleComplete={handleToggleComplete}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    onAddSubTask={handleAddSubTask}
                    onUpdateTags={handleUpdateTags}
                    onUpdatePriority={handleUpdatePriority}
                    onComment={handleCommentTask}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Çoklu Kart Görünümü</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTasks.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-muted-foreground">Filtre kriterlerine uygun görev bulunamadı</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={(taskId) => {}}
                        onUpdate={(taskId, updates) => {}}
                        onDelete={(taskId) => {}}
                        onPin={(taskId) => {}}
                        onAddSubTask={(parentTaskId) => {}}
                        onUpdateTags={(taskId, tags) => {}}
                        onUpdatePriority={(taskId, priority) => {}}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Multiple Cards for Comparison - only in single card mode */}
          {!showMultipleCards && (
            <Card>
              <CardHeader>
                <CardTitle>Çoklu Kart Karşılaştırması</CardTitle>
              </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Farklı Seviyeler</h4>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map(level => (
                    <TaskCard
                      key={level}
                      task={createMockTask({
                        id: `task-level-${level}`,
                        title: `Seviye ${level} Görev`,
                        level: level,
                        priority: level === 0 ? "HIGH" : level === 1 ? "MEDIUM" : "LOW"
                      })}
                      onToggleComplete={handleToggleComplete}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onPin={handlePin}
                      onAddSubTask={handleAddSubTask}
                      onUpdateTags={handleUpdateTags}
                      onUpdatePriority={handleUpdatePriority}
                        onComment={handleCommentTask}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Farklı Öncelikler</h4>
                <div className="space-y-2">
                  {["HIGH", "MEDIUM", "LOW", "NONE"].map(priorityLevel => (
                    <TaskCard
                      key={priorityLevel}
                      task={createMockTask({
                        id: `task-priority-${priorityLevel}`,
                        title: `${priorityLevel} Öncelik Görev`,
                        priority: priorityLevel,
                        level: 0
                      })}
                      onToggleComplete={handleToggleComplete}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onPin={handlePin}
                      onAddSubTask={handleAddSubTask}
                      onUpdateTags={handleUpdateTags}
                      onUpdatePriority={handleUpdatePriority}
                        onComment={handleCommentTask}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Görev Yorumları Modal'ı */}
      <TaskCommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => {
          setIsCommentsModalOpen(false)
          setCommentsModalTask(null)
        }}
        taskId={commentsModalTask?.id || ''}
        taskTitle={commentsModalTask?.title || ''}
        isTaskCompleted={commentsModalTask?.completed || false}
      />
    </div>
  )
}