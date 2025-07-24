"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Calendar, Search, ChevronDown, Sparkles, Wand2, Tag, Flag, Info } from "lucide-react"
import { generateTaskSuggestion, improveBrief } from "@/lib/ai"
import { ValidationAlert } from "@/components/ui/validation-alert"
import { DateTimePicker } from "../shared/date-time-picker"
import { PriorityPicker } from "@/components/ui/priority-picker"
import { TagPicker } from "@/components/ui/tag-picker"
import { ReminderPicker } from "@/components/ui/reminder-picker"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { PRIORITIES } from "@/lib/constants/priority"

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
  editingTask?: {
    id: string
    title: string
    description?: string
    projectId: string
    sectionId: string
    priority: string
    dueDate?: string
    tags?: Array<{
      id: string
      taskId: string
      tagId: string
      tag: {
        id: string
        name: string
        color: string
      }
    }>
    reminders?: Array<{
      id: string
      taskId: string
      datetime: Date
      message?: string
      isActive: boolean
    }>
  }
}

export function NewTaskModal({ isOpen, onClose, onSave, onTaskCreated, defaultProject, defaultSection, parentTaskId, parentTaskTitle, editingTask }: NewTaskModalProps) {
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
  const [parentTask, setParentTask] = useState<any>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<string>("Yok")
  const [reminders, setReminders] = useState<string[]>([])
  const { tags, fetchTags, createTag } = useTagStore()
  const { updateTaskTags, updateTaskReminders } = useTaskStore()
  const { createTask, updateTask, getTaskById } = useTaskStore()
  const { projects, fetchProjects, getSectionsByProject, fetchSections } = useProjectStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("yap")
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: "",
    message: ""
  })

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // Düzenleme modunda mevcut verileri yükle
        setTitle(editingTask.title)
        setDescription(editingTask.description || "")
        
        // Priority mapping (İngilizce'den Türkçe'ye)
        const priorityMapping: Record<string, string> = {
          'HIGH': 'Yüksek',
          'MEDIUM': 'Orta',
          'LOW': 'Düşük',
          'NONE': 'Yok',
          'CRITICAL': 'Kritik'
        }
        const mappedPriority = priorityMapping[editingTask.priority] || editingTask.priority
        setSelectedPriority(mappedPriority)
        
        setSelectedDateTime(editingTask.dueDate || null)
        setSelectedTags(editingTask.tags?.map(t => t.tag.name) || [])
        setReminders(editingTask.reminders?.map(r => {
          const date = new Date(r.datetime)
          const day = date.getDate()
          const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
          const month = monthNames[date.getMonth()]
          const year = date.getFullYear()
          const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          return `${day} ${month} ${year} ${time}`
        }) || [])
      } else {
        // Yeni görev modunda temiz başla
        setTitle("")
        setDescription("")
        setSelectedTags([])
        setSelectedPriority("Yok")
        setReminders([])
        setSelectedDateTime(null)
      }
      
      setProjectSearchInput("")
      setSectionSearchInput("")
      setShowProjectPicker(false)
      setShowSectionPicker(false)
      setShowDatePicker(false)
      setIsSubmitting(false)
      setIsAILoading(false)
      setAiPrompt("yap")
      fetchTags() // Fetch real tags data
      fetchProjects() // Fetch projects data
    }
  }, [isOpen, editingTask, fetchTags, fetchProjects])

  // Store'dan sections al
  const sections = selectedProject ? getSectionsByProject(selectedProject.id) : []

  // Default proje ve bölüm seçimleri
  useEffect(() => {
    if (isOpen) {
      // Düzenleme modu: editingTask'tan proje/bölüm bilgilerini yükle
      if (editingTask) {
        const editingProject = projects.find(p => p.id === editingTask.projectId)
        if (editingProject) {
          setSelectedProject(editingProject)
          fetchSections(editingProject.id).then(() => {
            const editingSection = getSectionsByProject(editingProject.id).find(s => s.id === editingTask.sectionId)
            if (editingSection) {
              setSelectedSection(editingSection)
            }
          })
        }
      }
      // Parent task ID'si verilmişse, parent task'ın proje/bölüm bilgilerini kullan
      else if (parentTaskId) {
        const foundParentTask = getTaskById(parentTaskId)
        if (foundParentTask) {
          setParentTask(foundParentTask)
          const parentProject = projects.find(p => p.id === foundParentTask.projectId)
          if (parentProject) {
            setSelectedProject(parentProject)
            fetchSections(parentProject.id).then(() => {
              const parentSection = getSectionsByProject(parentProject.id).find(s => s.id === foundParentTask.sectionId)
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
  }, [isOpen, projects, selectedProject, fetchSections, getSectionsByProject, defaultProject, defaultSection, parentTaskId, editingTask, getTaskById])

  const handleDateTimeSave = (dateTime: string | null) => {
    // Parent task validasyonu
    if (parentTaskId && dateTime) {
      const parentTask = getTaskById(parentTaskId)
      if (parentTask?.dueDate) {
        const parentDueDate = new Date(parentTask.dueDate)
        const selectedDate = new Date(dateTime)
        
        // Eğer parent task'ın saati 00:00 ise, gün sonuna kadar (23:59) izin ver
        const parentTaskEndOfDay = parentDueDate.getHours() === 0 && parentDueDate.getMinutes() === 0
          ? new Date(parentDueDate.getFullYear(), parentDueDate.getMonth(), parentDueDate.getDate(), 23, 59, 59)
          : parentDueDate
        
        if (selectedDate > parentTaskEndOfDay) {
          const parentDueDateWithTime = parentDueDate.getHours() === 0 && parentDueDate.getMinutes() === 0
            ? parentDueDate.toLocaleDateString('tr-TR')
            : `${parentDueDate.toLocaleDateString('tr-TR')} ${parentDueDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
          
          const selectedDateDisplay = new Date(dateTime).toLocaleDateString('tr-TR') + 
            (new Date(dateTime).getHours() !== 0 || new Date(dateTime).getMinutes() !== 0 
              ? ` ${new Date(dateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` 
              : '')
          
          setAlertConfig({
            isOpen: true,
            title: "Tarih Sınırı Aşıldı",
            message: `Alt görevin bitiş tarihi (${selectedDateDisplay}), üst görevin bitiş tarihinden (${parentDueDateWithTime}) sonra olamaz.`
          })
          return
        }
      }
    }
    
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

  const getPriorityColor = () => {
    // İngilizce priority değerlerini Türkçe'ye eşleştir (edit modunda gelen değerler için)
    const priorityMapping: Record<string, string> = {
      'HIGH': 'Yüksek',
      'MEDIUM': 'Orta',
      'LOW': 'Düşük',
      'NONE': 'Yok',
      'CRITICAL': 'Kritik'
    }
    
    const mappedPriority = priorityMapping[selectedPriority] || selectedPriority
    const priority = PRIORITIES.find(p => p.name === mappedPriority)
    return priority?.color || "#9ca3af" // Varsayılan olarak "Yok" rengini kullan
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
          return `${dateStr}T${time}:00`
        }
        return reminder
      })

      if (editingTask) {
        // Düzenleme modu: mevcut görevi güncelle
        const updateData = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: selectedProject.id,
          sectionId: selectedSection.id,
          priority: selectedPriority,
          dueDate: selectedDateTime || undefined,
        }

        await updateTask(editingTask.id, updateData)
        
        // Etiketleri güncelle
        if (selectedTags.length > 0) {
          const tagIds = selectedTags.map(tagName => {
            const tag = tags.find(t => t.name === tagName)
            return tag?.id
          }).filter(Boolean) as string[]
          await updateTaskTags(editingTask.id, tagIds)
        }
        
        // Hatırlatıcıları güncelle
        if (formattedReminders.length > 0) {
          const reminderData = formattedReminders.map(reminder => ({
            datetime: new Date(reminder),
            isActive: true
          }))
          await updateTaskReminders(editingTask.id, reminderData)
        }
      } else {
        // Yeni görev modu: yeni görev oluştur  
        // Eğer parent task'ın due date'i var ve kullanıcı tarih seçmemişse, otomatik ata
        let finalDueDate = selectedDateTime
        if (!selectedDateTime && parentTask?.dueDate) {
          finalDueDate = parentTask.dueDate
        }
        
        const taskData: CreateTaskRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: selectedProject.id,
          sectionId: selectedSection.id,
          priority: selectedPriority,
          dueDate: finalDueDate || undefined,
          tags: selectedTags,
          reminders: formattedReminders,
          ...(parentTaskId && { parentTaskId })
        }

        const newTask = await createTask(taskData)
        
        if (onTaskCreated) {
          onTaskCreated(newTask)
        }
      }

      // Modal'ı kapat
      onClose()
      
      // onSave callback'ini çağır
      if (onSave) {
        onSave(title.trim(), description.trim(), selectedProject.id, selectedSection.id)
      }
    } catch (error) {
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

  // AI yardımcı fonksiyonları
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsAILoading(true)
    try {
      // Mevcut etiket isimlerini al
      const availableTagNames = tags.map(tag => tag.name)
      
      // Parent task bilgilerini al
      const parentTaskDueDate = parentTaskId ? (() => {
        const parentTask = getTaskById(parentTaskId)
        return parentTask?.dueDate ? new Date(parentTask.dueDate) : null
      })() : null

      const suggestion = await generateTaskSuggestion(
        aiPrompt,
        selectedProject?.name,
        selectedSection?.name,
        availableTagNames,
        parentTaskDueDate
      )
      
      setTitle(suggestion.title)
      setDescription(suggestion.description)
      
      // Rastgele seçilen özellikleri uygula
      if (suggestion.priority) {
        setSelectedPriority(suggestion.priority)
      }
      
      if (suggestion.tags && suggestion.tags.length > 0) {
        setSelectedTags(suggestion.tags)
      }
      
      if (suggestion.dueDate) {
        setSelectedDateTime(suggestion.dueDate)
      }
      
      if (suggestion.reminders && suggestion.reminders.length > 0) {
        setReminders(suggestion.reminders)
      }
      
      setAiPrompt("yap")
    } catch (error) {
    } finally {
      setIsAILoading(false)
    }
  }

  const handleImproveBrief = async () => {
    if (!description.trim()) return
    
    setIsAILoading(true)
    try {
      const improvedDescription = await improveBrief(description)
      setDescription(improvedDescription)
    } catch (error) {
    } finally {
      setIsAILoading(false)
    }
  }

  const handleQuickAIGenerate = async () => {
    setIsAILoading(true)
    try {
      // Mevcut context bilgilerini topla
      const contextPrompt = [
        selectedProject?.name ? `Proje: ${selectedProject.name}` : '',
        selectedSection?.name ? `Bölüm: ${selectedSection.name}` : '',
        parentTask?.title ? `Üst Görev: ${parentTask.title}` : ''
      ].filter(Boolean).join(', ')
      
      const aiPrompt = contextPrompt ? 
        `${contextPrompt} için uygun bir görev öner` : 
        'Genel bir iş görevi öner'
      
      // Mevcut etiket isimlerini al
      const availableTagNames = tags.map(tag => tag.name)
      
      // Parent task bilgilerini al
      const parentTaskDueDate = parentTask?.dueDate ? new Date(parentTask.dueDate) : null

      const suggestion = await generateTaskSuggestion(
        aiPrompt,
        selectedProject?.name,
        selectedSection?.name,
        availableTagNames,
        parentTaskDueDate
      )
      
      // Form alanlarını doldur
      setTitle(suggestion.title)
      setDescription(suggestion.description)
      
      // Öncelik ata
      if (suggestion.priority) {
        setSelectedPriority(suggestion.priority)
      }
      
      // Etiketleri ata
      if (suggestion.tags && suggestion.tags.length > 0) {
        setSelectedTags(suggestion.tags)
      }
      
      // Tarih ata (parent task yoksa veya parent'ın tarihi yoksa)
      if (suggestion.dueDate && !parentTask?.dueDate) {
        setSelectedDateTime(suggestion.dueDate)
      }
      
    } catch (error) {
      console.error('AI öneri hatası:', error)
    } finally {
      setIsAILoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl top-[10%] translate-y-0">
          {/* Modal Header with Proper Layout */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <DialogTitle className="text-lg font-semibold leading-tight pr-2 flex-1 min-w-0">
              {editingTask ? '✏️ Görevi Düzenle' : 
               parentTaskId ? `🔗 Alt Görev Ekle${parentTaskTitle ? `: ${parentTaskTitle}` : ''}` : 
               '🎯 Görev Ekle'}
            </DialogTitle>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickAIGenerate}
                disabled={isAILoading}
                className="h-8 px-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40"
                title="AI ile görev öner"
              >
                {isAILoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-purple-600 border-t-transparent" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-xs text-purple-700 dark:text-purple-300">AI</span>
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfoModal(true)}
                className="h-8 w-8"
                title="Yardım"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
          <div className="relative">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              onKeyDown={handleKeyDown}
            />
            {description.trim() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImproveBrief}
                    disabled={isAILoading}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    {isAILoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI ile açıklamayı geliştir</p>
                </TooltipContent>
              </Tooltip>
            )}
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
                    parentTaskDueDate={parentTaskId ? (() => {
                      const parentTask = getTaskById(parentTaskId)
                      return parentTask?.dueDate ? new Date(parentTask.dueDate) : null
                    })() : null}
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
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 relative"
                      >
                        <Tag className="h-4 w-4" />
                        {selectedTags.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] rounded-full min-w-3 h-3 flex items-center justify-center px-0.5">
                            {selectedTags.length}
                          </span>
                        )}
                      </Button>
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Etiketler</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <PriorityPicker
                    selectedPriority={selectedPriority}
                    onPrioritySelect={handlePrioritySelect}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        style={{ color: getPriorityColor() }}
                      >
                        <Flag 
                          className="h-4 w-4" 
                          style={{ fill: 'currentColor', stroke: 'currentColor' }}
                        />
                      </Button>
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Öncelik</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ReminderPicker
                    selectedReminders={reminders}
                    onRemindersChange={setReminders}
                    parentTaskDueDate={parentTaskId ? (() => {
                      const parentTask = getTaskById(parentTaskId)
                      return parentTask?.dueDate ? new Date(parentTask.dueDate) : null
                    })() : editingTask && selectedDateTime ? new Date(selectedDateTime) : null}
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
                  onClick={() => (!parentTaskId && !editingTask) && setShowProjectPicker(!showProjectPicker)}
                  className="flex items-center space-x-2"
                  disabled={!!parentTaskId || !!editingTask}
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
                  onClick={() => (!parentTaskId && !editingTask) && setShowSectionPicker(!showSectionPicker)}
                  className="flex items-center space-x-2"
                  disabled={!selectedProject || !!parentTaskId || !!editingTask}
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
              {isSubmitting ? (editingTask ? "Güncelleniyor..." : "Ekleniyor...") : 
               editingTask ? "Görevi Güncelle" :
               parentTaskId ? "Alt Görev Ekle" : "Görev Ekle"}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
      
      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] top-[10%] translate-y-0">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <Info className="h-6 w-6 text-blue-500" />
            <span>Görev Ekleme Rehberi</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoModal(false)}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* AI Yardımcı Bilgisi */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium text-purple-700 dark:text-purple-300">AI Yardımcı</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Modal başlığındaki mor AI butonuna tıklayın</p>
                <p>• Seçili proje, bölüm ve üst görev bilgilerine göre otomatik önerir</p>
                <p>• Başlık, açıklama, öncelik ve etiketleri otomatik doldurur</p>
                <p>• Önerilen içerikleri daha sonra düzenleyebilirsiniz</p>
              </div>
            </section>

            {/* Alt Görev Bilgisi */}
            {parentTaskId && parentTask && (
              <section className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Alt Görev Ekleme</h3>
                </div>
                <div className="text-sm text-muted-foreground space-y-2 pl-6">
                  <p><strong>Üst Görev:</strong> {parentTask.title}</p>
                  {parentTask.dueDate && (
                    <p><strong>Üst Görev Son Tarihi:</strong> {new Date(parentTask.dueDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      ...(new Date(parentTask.dueDate).getHours() !== 0 || new Date(parentTask.dueDate).getMinutes() !== 0) && {
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    })}</p>
                  )}
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-orange-700 dark:text-orange-300 font-medium">📋 Önemli Kurallar:</p>
                    <ul className="mt-2 space-y-1 text-orange-600 dark:text-orange-400">
                      <li>• Alt görev, üst görevden daha geç bitirilemez</li>
                      {parentTask.dueDate && <li>• Tarih seçmezseniz, üst görevin tarihi otomatik atanır</li>}
                      <li>• Üst görev tamamlanmadan tamamlanamaz</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Tarih Seçimi */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <h3 className="font-medium text-green-700 dark:text-green-300">Tarih ve Saat</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Takvim ikonuna tıklayarak tarih/saat seçebilirsiniz</p>
                <p>• Sadece tarih seçmek için saati 00:00 bırakın</p>
                <p>• Seçilen tarih kartlarda renkli olarak gösterilir</p>
                {parentTaskId && <p>• Alt görevlerde üst görev tarihi sınırlaması uygulanır</p>}
              </div>
            </section>

            {/* Etiket ve Öncelik */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-blue-700 dark:text-blue-300">Etiket ve Öncelik</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Etiket ikonu ile görevleri kategorilere ayırabilirsiniz</p>
                <p>• Bayrak ikonu ile öncelik seviyesi belirleyebilirsiniz</p>
                <p>• Öncelik renkleri: Kritik (kırmızı), Yüksek (turuncu), Orta (sarı), Düşük (mavi)</p>
              </div>
            </section>

            {/* Hatırlatıcı */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🔔</span>
                <h3 className="font-medium text-yellow-700 dark:text-yellow-300">Hatırlatıcılar</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Çan ikonu ile hatırlatıcı ekleyebilirsiniz</p>
                <p>• Birden fazla hatırlatıcı ayarlayabilirsiniz</p>
                <p>• Hatırlatıcılar belirlenen zamanda bildirim gönderir</p>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      
      <ValidationAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false, title: "", message: "" })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </TooltipProvider>
  )
}