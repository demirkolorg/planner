"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Calendar, Clock, ChevronRight, Plus, ChevronLeft, Tag, Check, Search, Bell, ChevronDown } from "lucide-react"
import { DateTimePicker } from "../shared/date-time-picker"
import { PriorityPicker } from "@/components/ui/priority-picker"
import { TagPicker } from "@/components/ui/tag-picker"
import { ReminderPicker } from "@/components/ui/reminder-picker"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"

import type { Project, Section, CreateTaskRequest } from "@/types/task"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (title: string, description: string, projectId: string, sectionId: string) => void
  onTaskCreated?: (task?: any) => void
  defaultProject?: {
    id: string
    name: string
    emoji?: string
  }
  defaultSection?: {
    id: string
    name: string
    projectId: string
  }
  parentTaskId?: string
  parentTaskTitle?: string
}

export function NewTaskModal({ isOpen, onClose, onSave, onTaskCreated, defaultProject, defaultSection, parentTaskId, parentTaskTitle }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [projectSearchInput, setProjectSearchInput] = useState("")
  const [sectionSearchInput, setSectionSearchInput] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<string>("Yok")
  const [reminders, setReminders] = useState<string[]>([])
  const { tags, fetchTags, createTag } = useTagStore()
  const { createTask, getTaskById } = useTaskStore()
  const { projects, fetchProjects, getSectionsByProject, fetchSections } = useProjectStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setDescription("")
      setProjectSearchInput("")
      setSectionSearchInput("")
      setShowProjectPicker(false)
      setShowSectionPicker(false)
      setShowDatePicker(false)
      setSelectedTags([])
      setSelectedPriority("Yok")
      setReminders([])
      setSelectedDateTime(null)
      setIsSubmitting(false)
      fetchTags() // Fetch real tags data
      fetchProjects() // Fetch projects data
    }
  }, [isOpen, fetchTags, fetchProjects])

  // Store'dan sections al
  const sections = selectedProject ? getSectionsByProject(selectedProject.id) : []

  // Default proje ve bölüm seçimleri
  useEffect(() => {
    if (isOpen) {
      // Eğer parent task ID'si verilmişse, parent task'ın proje/bölüm bilgilerini kullan
      if (parentTaskId) {
        const parentTask = getTaskById(parentTaskId)
        if (parentTask) {
          const parentProject = projects.find(p => p.id === parentTask.projectId)
          if (parentProject) {
            setSelectedProject(parentProject)
            fetchSections(parentProject.id).then(() => {
              const parentSection = getSectionsByProject(parentProject.id).find(s => s.id === parentTask.sectionId)
              if (parentSection) {
                setSelectedSection(parentSection)
              }
            })
          }
        }
      }
      // Eğer default değerler verilmişse bunları kullan
      else if (defaultProject && projects.find(p => p.id === defaultProject.id)) {
        setSelectedProject(defaultProject as Project)
        
        if (defaultSection) {
          // Sections yüklenmesini bekle
          const timer = setTimeout(() => {
            const foundSection = getSectionsByProject(defaultProject.id).find(s => s.id === defaultSection.id)
            if (foundSection) {
              setSelectedSection(foundSection)
            }
          }, 100)
          return () => clearTimeout(timer)
        }
      } else if (projects.length > 0 && !selectedProject) {
        // Fallback: varsayılan seçimler - "Gelen Kutusu" projesini default olarak seç
        const inboxProject = projects.find((p: Project) => p.name === "Gelen Kutusu")
        if (inboxProject) {
          setSelectedProject(inboxProject)
          fetchSections(inboxProject.id).then(() => {
            const projectSections = getSectionsByProject(inboxProject.id)
            // "Genel" bölümünü default olarak seç
            const generalSection = projectSections.find((s: Section) => s.name === "Genel")
            if (generalSection) {
              setSelectedSection(generalSection)
            }
          })
        }
      }
    }
  }, [isOpen, projects, selectedProject, fetchSections, getSectionsByProject, defaultProject, defaultSection, parentTaskId, getTaskById])

  const handleDateTimeSave = (dateTime: string | null) => {
    setSelectedDateTime(dateTime)
    setShowDatePicker(false)
  }

  const handleDateTimeCancel = () => {
    setShowDatePicker(false)
  }


  const getDisplayDateTime = () => {
    if (selectedDateTime) {
      const date = new Date(selectedDateTime)
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short'
      })
      
      // Eğer saat 00:00 ise sadece tarihi göster
      const hours = date.getHours()
      const minutes = date.getMinutes()
      
      if (hours === 0 && minutes === 0) {
        return dateStr
      }
      
      const timeStr = date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      return `${dateStr} ${timeStr}`
    }
    return "Zamanla"
  }

  const handleTagsChange = (newTags: string[]) => {
    setSelectedTags(newTags)
  }


  const handlePrioritySelect = (priority: string) => {
    setSelectedPriority(priority)
  }

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project)
    setShowProjectPicker(false)
    setProjectSearchInput("")
    // Proje seçilince o projenin bölümlerini getir ve "Genel"i seç
    await fetchSections(project.id)
    const projectSections = getSectionsByProject(project.id)
    const generalSection = projectSections.find((s: Section) => s.name === "Genel")
    if (generalSection) {
      setSelectedSection(generalSection)
    } else if (projectSections.length > 0) {
      setSelectedSection(projectSections[0])
    }
  }

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section)
    setShowSectionPicker(false)
    setSectionSearchInput("")
  }

  const getFilteredProjects = () => {
    return projects.filter(project => 
      project.name.toLowerCase().includes(projectSearchInput.toLowerCase())
    )
  }

  const getFilteredSections = () => {
    return sections.filter(section => 
      section.name.toLowerCase().includes(sectionSearchInput.toLowerCase())
    )
  }


  const handleSave = async () => {
    if (!title.trim() || !selectedProject || !selectedSection) {
      return
    }

    setIsSubmitting(true)

    try {
      // Hatırlatıcı tarihlerini düzenle
      const formattedReminders = reminders.map(reminder => {
        // "19 Temmuz 2025 14:30" formatından Date string'e çevir
        const parts = reminder.split(' ')
        if (parts.length >= 4) {
          const day = parts[0]
          const monthName = parts[1]
          const year = parts[2]
          const time = parts[3]
          
          const monthMap: Record<string, string> = {
            'Ocak': '01', 'Şubat': '02', 'Mart': '03', 'Nisan': '04',
            'Mayıs': '05', 'Haziran': '06', 'Temmuz': '07', 'Ağustos': '08',
            'Eylül': '09', 'Ekim': '10', 'Kasım': '11', 'Aralık': '12'
          }
          
          const month = monthMap[monthName] || '01'
          const dateStr = `${year}-${month}-${day.padStart(2, '0')}`
          return `${dateStr}T${time}:00.000Z`
        }
        return reminder
      })

      const taskData: CreateTaskRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: selectedProject.id,
        sectionId: selectedSection.id,
        priority: selectedPriority,
        dueDate: selectedDateTime || undefined,
        tags: selectedTags,
        reminders: formattedReminders,
        ...(parentTaskId && { parentTaskId })
      }

      // TaskStore'u kullanarak görev oluştur
      const newTask = await createTask(taskData)

      // Önce modal'ı kapat
      onClose()
      
      // Sonra callback'leri çağır
      if (onSave) {
        onSave(title.trim(), description.trim(), selectedProject.id, selectedSection.id)
      }
      if (onTaskCreated) {
        onTaskCreated(newTask)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      // TODO: Kullanıcıya hata mesajı göster
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl top-[10%] translate-y-0">
          <DialogTitle className="text-lg font-semibold">
            {parentTaskId ? `🔗 Alt Görev Ekle${parentTaskTitle ? `: ${parentTaskTitle}` : ''}` : '🎯 Görev Ekle'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>

        {/* Content */}
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yapılacak adı"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagName) => {
                const tag = tags.find(t => t.name === tagName)
                const tagColor = tag?.color || "#3b82f6"
                return (
                  <div
                    key={tagName}
                    className="px-2 py-1 rounded-md text-xs flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${tagColor}30`,
                      color: tagColor
                    }}
                  >
                    <span>{tagName}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="relative group flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {getDisplayDateTime()}
              </Button>
              {selectedDateTime && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDateTime(null)
                        setShowDatePicker(false)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tarih/Saati Temizle</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Date Time Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <DateTimePicker
                    initialDateTime={selectedDateTime}
                    onSave={handleDateTimeSave}
                    onCancel={handleDateTimeCancel}
                    isModal={true}
                  />
                </div>
              )}

            </div>

            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TagPicker
                    selectedTags={selectedTags}
                    onTagsChange={handleTagsChange}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Etiketler</p>
                </TooltipContent>
              </Tooltip>
              
              <PriorityPicker
                selectedPriority={selectedPriority}
                onPrioritySelect={handlePrioritySelect}
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ReminderPicker
                    selectedReminders={reminders}
                    onRemindersChange={setReminders}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hatırlatıcılar</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Project and Section Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Project Selection */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !parentTaskId && setShowProjectPicker(!showProjectPicker)}
                  className="flex items-center space-x-2"
                  disabled={!!parentTaskId}
                >
                {selectedProject ? (
                  <span className="truncate max-w-[200px]">
                    {selectedProject.emoji} {selectedProject.name.length > 20 ? selectedProject.name.substring(0, 20) + '...' : selectedProject.name}
                  </span>
                ) : (
                  <span>Proje Seç</span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>

                {/* Project Picker Dropdown */}
                {showProjectPicker && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-background border rounded-lg shadow-lg z-50 p-3">
                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        value={projectSearchInput}
                        onChange={(e) => setProjectSearchInput(e.target.value)}
                        placeholder="Proje ara..."
                        className="pl-8 h-8 text-xs"
                      />
                    </div>

                    {/* Project List */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {/* Gelen Kutusu önce göster */}
                      {projects.filter(p => p.name === "Gelen Kutusu").map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handleProjectSelect(project)}
                        >
                          <span className="text-sm">{project.emoji} {project.name}</span>
                        </div>
                      ))}
                      
                      {/* Diğer projeler */}
                      {getFilteredProjects().filter(p => p.name !== "Gelen Kutusu").map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handleProjectSelect(project)}
                        >
                          <span className="text-sm">{project.emoji} {project.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span>→</span>

              {/* Section Selection */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !parentTaskId && setShowSectionPicker(!showSectionPicker)}
                  className="flex items-center space-x-2"
                  disabled={!selectedProject || !!parentTaskId}
                >
                  {selectedSection ? (
                    <span className="truncate max-w-[150px]">
                      {selectedSection.name.length > 15 ? selectedSection.name.substring(0, 15) + '...' : selectedSection.name}
                    </span>
                  ) : (
                    <span>Bölüm Seç</span>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>

                {/* Section Picker Dropdown */}
                {showSectionPicker && selectedProject && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 p-3">
                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        value={sectionSearchInput}
                        onChange={(e) => setSectionSearchInput(e.target.value)}
                        placeholder="Bölüm ara..."
                        className="pl-8 h-8 text-xs"
                      />
                    </div>

                    {/* Section List */}
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {getFilteredSections().map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handleSectionSelect(section)}
                        >
                          <span className="text-sm">{section.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !selectedProject || !selectedSection || isSubmitting}
            >
              {isSubmitting ? "Ekleniyor..." : (parentTaskId ? "Alt Görev Ekle" : "Görev Ekle")}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}