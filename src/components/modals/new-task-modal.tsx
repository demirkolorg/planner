"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Calendar, Clock, Search, ChevronDown, Sparkles, Wand2, Tag, Flag, Info, Brain } from "lucide-react"
import { generateTaskSuggestion, improveBrief, improveTitle } from "@/lib/ai"
import { ValidationAlert } from "@/components/ui/validation-alert"
import { DatePicker } from "../shared/date-picker"
import { TimePicker } from "../shared/time-picker"
import { PriorityPicker } from "@/components/ui/priority-picker"
import { TagPicker } from "@/components/ui/tag-picker"
import { useTagStore } from "@/store/tagStore"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { PRIORITIES } from "@/lib/constants/priority"

import type { Project, Section, CreateTaskRequest } from "@/types/task"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (title: string, description: string, projectId: string, sectionId: string) => void
  onTaskCreated?: (task?: Task) => void
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
  defaultTaskType?: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE'
  defaultQuickNoteCategory?: string
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
    assignments?: Array<{
      id: string
      assigneeId: string
      assignedBy: string
      assignedAt: string
      assignee: {
        id: string
        firstName: string
        lastName: string
        email: string
      }
      assigner: {
        id: string
        firstName: string
        lastName: string
        email: string
      }
    }>
  }
}

export function NewTaskModal({ isOpen, onClose, onSave, onTaskCreated, defaultProject, defaultSection, parentTaskId, parentTaskTitle, defaultTaskType, defaultQuickNoteCategory, editingTask }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [projectSearchInput, setProjectSearchInput] = useState("")
  const [sectionSearchInput, setSectionSearchInput] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // DD.MM.YYYY format
  const [selectedTime, setSelectedTime] = useState<string | null>(null) // HH:MM format
  const [parentTask, setParentTask] = useState<Task | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<string>("NONE")
  const { tags, fetchTags, createTag } = useTagStore()
  const { updateTaskTags } = useTaskStore()
  const { createTask, updateTask, getTaskById } = useTaskStore()
  const { projects, fetchProjects, getSectionsByProject, fetchSections } = useProjectStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAILoading, setIsAILoading] = useState(false)
  const [isTitleAILoading, setIsTitleAILoading] = useState(false)
  const [isDescriptionAILoading, setIsDescriptionAILoading] = useState(false)
  const [isTagAILoading, setIsTagAILoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("yap")
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: "",
    message: ""
  })

  // Modal açıldığında sadece bir kez data fetch et
  useEffect(() => {
    if (isOpen) {
      // Sadece store boşsa fetch et
      if (tags.length === 0) fetchTags()
      if (projects.length === 0) fetchProjects()
    }
  }, [isOpen, tags.length, projects.length, fetchTags, fetchProjects])


  // Modal açıldığında form state'ini initialize et
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        // Düzenleme modunda mevcut verileri yükle
        setTitle(editingTask.title)
        setDescription(editingTask.description || "")
        
        // Priority mapping - editingTask.priority zaten İngilizce database değeri
        setSelectedPriority(editingTask.priority)
        
        // DueDate'i tarih ve saat olarak ayır
        if (editingTask.dueDate) {
          const date = new Date(editingTask.dueDate)
          const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
          setSelectedDate(dateStr)
          
          // All-day event değilse saati de set et
          const isAllDayEvent = editingTask.dueDate.includes('T00:00:00.000Z')
          if (!isAllDayEvent) {
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            setSelectedTime(timeStr)
          }
        }
        setSelectedTags(editingTask.tags?.map(t => t.tag.name) || [])
        
        // Not: Atama bilgileri artık SimpleAssignmentButton ile yönetiliyor
      } else {
        // Yeni görev modunda temiz başla
        setTitle("")
        setDescription("")
        setSelectedTags([])
        setSelectedPriority("NONE")
        setSelectedDate(null)
        setSelectedTime(null)
        // Atamalar artık SimpleAssignmentButton ile yönetiliyor
      }
      
      // UI state'leri reset et
      setProjectSearchInput("")
      setSectionSearchInput("")
      setShowProjectPicker(false)
      setShowSectionPicker(false)
      setShowDatePicker(false)
      setShowTimePicker(false)
      setIsSubmitting(false)
      setIsAILoading(false)
      setAiPrompt("yap")
    }
  }, [isOpen, editingTask]) // tags.length, projects.length kaldırıldı

  // Store'dan sections al
  const sections = selectedProject ? getSectionsByProject(selectedProject.id) : []

  // Auto-resize description textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto'
      descriptionRef.current.style.height = `${Math.min(descriptionRef.current.scrollHeight, 240)}px`
    }
  }, [description])

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
        // Fallback: varsayılan seçimler - önce sabitlenmiş projeleri, sonra "Gelen Kutusu" projesini kontrol et
        const pinnedProjects = projects.filter((p: Project) => p.isPinned).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
        const inboxProject = projects.find((p: Project) => p.name === "Gelen Kutusu")
        
        const defaultProject = pinnedProjects[0] || inboxProject
        if (defaultProject) {
          setSelectedProject(defaultProject)
          fetchSections(defaultProject.id).then(() => {
            const projectSections = getSectionsByProject(defaultProject.id)
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

  const handleDateSave = (date: string | null) => {
    setSelectedDate(date)
    setShowDatePicker(false)
  }

  const handleDateCancel = () => {
    setShowDatePicker(false)
  }

  const handleTimeSave = (time: string | null) => {
    setSelectedTime(time)
    setShowTimePicker(false)
  }

  const handleTimeCancel = () => {
    setShowTimePicker(false)
  }

  // Tarih ve saati birleştirerek ISO string oluştur
  const combineDateTime = (): string | null => {
    if (!selectedDate) return null
    
    try {
      // DD.MM.YYYY formatını parse et
      const [day, month, year] = selectedDate.split('.')
      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      
      if (selectedTime) {
        // Saat var - tam tarih-saat
        const [hours, minutes] = selectedTime.split(':')
        const hoursNum = parseInt(hours)
        const minutesNum = parseInt(minutes)
        const date = new Date(yearNum, monthNum - 1, dayNum, hoursNum, minutesNum)
        return date.toISOString()
      } else {
        // Saat yok - all-day event
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}T00:00:00.000Z`
      }
    } catch (error) {
      return null
    }
  }


  const getDisplayDate = () => {
    if (selectedDate) {
      // DD.MM.YYYY formatından display formatına dönüştür
      const [day, month, year] = selectedDate.split('.')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short'
      })
    }
    return "Tarih Seç"
  }

  const getDisplayTime = () => {
    return selectedTime || "Saat Seç"
  }

  const handleTagsChange = (newTags: string[]) => {
    setSelectedTags(newTags)
  }

  const getPriorityColor = () => {
    // Yeni priority yapısını kullan - value ile eşleştir
    const priority = PRIORITIES.find(p => p.value === selectedPriority)
    return priority?.color || PRIORITIES.find(p => p.value === "NONE")?.color || "#9ca3af"
  }

  const handlePrioritySelect = (priority: string) => {
    setSelectedPriority(priority)
  }

  const handleProjectSelect = async (project: Project) => {
    // Update UI immediately (optimistic update)
    setSelectedProject(project)
    setShowProjectPicker(false)
    setProjectSearchInput("")
    
    try {
      // Check if sections already exist in store
      let projectSections = getSectionsByProject(project.id)
      
      // Only fetch if sections don't exist
      if (projectSections.length === 0) {
        await fetchSections(project.id)
        projectSections = getSectionsByProject(project.id)
      }
      
      // Auto-select appropriate section
      const generalSection = projectSections.find((s: Section) => s.name === "Genel")
      if (generalSection) {
        setSelectedSection(generalSection)
      } else if (projectSections.length > 0) {
        setSelectedSection(projectSections[0])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
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
    console.log('💾 Task kaydetme işlemi başladı:', { 
      title: title.trim(), 
      selectedProject, 
      selectedSection, 
      parentTaskId 
    })
    
    if (!title.trim() || !selectedProject || !selectedSection) {
      console.log('❌ Gerekli alanlar eksik:', { 
        hasTitle: !!title.trim(), 
        hasProject: !!selectedProject, 
        hasSection: !!selectedSection 
      })
      return
    }

    setIsSubmitting(true)

    try {

      if (editingTask) {
        // Düzenleme modu: mevcut görevi güncelle
        const updateData = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: selectedProject.id,
          sectionId: selectedSection.id,
          priority: selectedPriority,
          dueDate: combineDateTime() || undefined,
        }

        // Tüm update işlemlerini paralel yap
        const updatePromises = [updateTask(editingTask.id, updateData)]
        
        // Etiketleri güncelle
        if (selectedTags.length > 0) {
          const tagIds = selectedTags.map(tagName => {
            const tag = tags.find(t => t.name === tagName)
            return tag?.id
          }).filter(Boolean) as string[]
          updatePromises.push(updateTaskTags(editingTask.id, tagIds))
        }
        
        // Tüm işlemleri paralel bekle
        await Promise.all(updatePromises)
        
        // Assignment güncellemesi artık SimpleAssignmentModal ile yapılıyor
      } else {
        // Yeni görev modu: yeni görev oluştur  
        console.log('🆕 Yeni görev oluşturma modu:', { parentTaskId, parentTask })
        
        // Eğer parent task'ın due date'i var ve kullanıcı tarih seçmemişse, otomatik ata
        let finalDueDate = combineDateTime()
        if (!finalDueDate && parentTask?.dueDate) {
          finalDueDate = parentTask.dueDate
          console.log('📅 Parent task due date otomatik atandı:', finalDueDate)
        }
        
        const taskData: CreateTaskRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          projectId: defaultTaskType === 'QUICK_NOTE' || defaultTaskType === 'CALENDAR' ? undefined : selectedProject.id,
          sectionId: defaultTaskType === 'QUICK_NOTE' || defaultTaskType === 'CALENDAR' ? undefined : selectedSection.id,
          priority: selectedPriority,
          dueDate: finalDueDate || undefined,
          tags: selectedTags,
          taskType: defaultTaskType || 'PROJECT',
          ...(defaultTaskType === 'QUICK_NOTE' && defaultQuickNoteCategory && { quickNoteCategory: defaultQuickNoteCategory }),
          ...(parentTaskId && { parentTaskId })
        }
        console.log('📋 Oluşturulacak task data:', taskData)

        const newTask = await createTask(taskData)
        console.log('✅ Yeni task oluşturuldu:', newTask)
        
        
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
      } else {
        // Eğer AI öncelik önermediyse, rastgele bir öncelik seç
        const priorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        const randomPriority = priorityValues[Math.floor(Math.random() * priorityValues.length)]
        setSelectedPriority(randomPriority)
      }
      
      if (suggestion.tags && suggestion.tags.length > 0) {
        setSelectedTags(suggestion.tags)
      }
      
      if (suggestion.dueDate) {
        // Suggestion'dan gelen ISO string'i tarih ve saat olarak ayır
        const date = new Date(suggestion.dueDate)
        const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
        setSelectedDate(dateStr)
        
        // All-day event değilse saati de set et
        const isAllDayEvent = suggestion.dueDate.includes('T00:00:00.000Z')
        if (!isAllDayEvent) {
          const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          setSelectedTime(timeStr)
        }
      }
      
      
      setAiPrompt("yap")
    } catch (error) {
    } finally {
      setIsAILoading(false)
    }
  }

  const handleImproveBrief = async () => {
    if (!description.trim()) return
    
    setIsDescriptionAILoading(true)
    try {
      const improvedDescription = await improveBrief(description)
      setDescription(improvedDescription)
    } catch (error) {
      console.error('Description improvement error:', error)
    } finally {
      setIsDescriptionAILoading(false)
    }
  }

  const handleImproveTitle = async () => {
    if (!title.trim()) return
    
    setIsTitleAILoading(true)
    try {
      const improvedTitle = await improveTitle(title)
      setTitle(improvedTitle)
    } catch (error) {
      console.error('Title improvement error:', error)
    } finally {
      setIsTitleAILoading(false)
    }
  }

  const handleAISuggestTags = async () => {
    if (!title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Başlık Gerekli",
        message: "AI etiket önerisi için önce bir başlık girmelisiniz."
      })
      return
    }
    
    setIsTagAILoading(true)
    try {
      const response = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined
        })
      })
      
      if (!response.ok) {
        throw new Error('Etiket önerisi alınamadı')
      }
      
      const data = await response.json()
      
      if (data.tags && data.tags.length > 0) {
        // Önerilen etiketleri mevcut etiketlerle birleştir
        const newTagNames = data.tags.map((tag: { name: string }) => tag.name)
        const uniqueTags = [...new Set([...selectedTags, ...newTagNames])]
        setSelectedTags(uniqueTags)
        
        // TagStore'u güncelle (yeni etiketler eklenmişse)
        await fetchTags()
        
        // Başarı mesajı gösterme
      }
    } catch (error) {
      console.error('Tag suggestion error:', error)
      setAlertConfig({
        isOpen: true,
        title: "Hata",
        message: "AI etiket önerisi alınırken bir hata oluştu. Lütfen tekrar deneyin."
      })
    } finally {
      setIsTagAILoading(false)
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
      
      // Tarih ata - AI önerisi varsa kullan
      if (suggestion.dueDate) {
        // Suggestion'dan gelen ISO string'i tarih ve saat olarak ayır
        const date = new Date(suggestion.dueDate)
        const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
        setSelectedDate(dateStr)
        
        // All-day event değilse saati de set et
        const isAllDayEvent = suggestion.dueDate.includes('T00:00:00.000Z')
        if (!isAllDayEvent) {
          const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          setSelectedTime(timeStr)
        }
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
          <DialogDescription className="sr-only">
            Yeni görev oluşturmak veya mevcut görevi düzenlemek için form
          </DialogDescription>
          {/* Modal Header with Proper Layout */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <DialogTitle className="text-lg font-semibold leading-relaxed pr-2 flex-1 min-w-0 mb-2">
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
                className={`h-8 px-3 bg-primary/10 hover:bg-primary/20 transition-all duration-200 ${
                  isAILoading ? 'animate-pulse bg-primary/20' : ''
                }`}
                title={isAILoading ? "AI görev üretiyor..." : "AI ile görev öner"}
              >
                <div className="relative flex items-center">
                  <Sparkles 
                    className={`h-4 w-4 text-primary mr-1 transition-all duration-300 ${
                      isAILoading 
                        ? 'animate-pulse scale-110 drop-shadow-sm' 
                        : 'hover:scale-105'
                    }`}
                    style={{
                      animation: isAILoading 
                        ? 'sparkle 1.5s ease-in-out infinite, pulse 1.5s ease-in-out infinite' 
                        : undefined
                    }}
                  />
                  <span className={`text-xs text-primary transition-all duration-300 ${
                    isAILoading ? 'animate-pulse' : ''
                  }`}>
                    {isAILoading ? 'Üretiyor...' : 'ai'}
                  </span>
                  
                  {/* Sparkle effect overlay */}
                  {isAILoading && (
                    <>
                      <div className="absolute -inset-2 opacity-75 pointer-events-none">
                        <div 
                          className="absolute top-0 left-0 w-1 h-1 bg-primary/60 rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '0s' 
                          }} 
                        />
                        <div 
                          className="absolute top-1 right-0 w-0.5 h-0.5 bg-primary/40 rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '0.5s' 
                          }} 
                        />
                        <div 
                          className="absolute bottom-0 left-1 w-0.5 h-0.5 bg-primary/80 rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '1s' 
                          }} 
                        />
                        <div 
                          className="absolute bottom-1 right-1 w-1 h-1 bg-primary/60 rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '1.5s' 
                          }} 
                        />
                        <div 
                          className="absolute top-2 left-1/2 w-0.5 h-0.5 bg-primary/20 rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '0.8s' 
                          }} 
                        />
                        <div 
                          className="absolute bottom-2 right-1/3 w-0.5 h-0.5 bg-primary rounded-full"
                          style={{ 
                            animation: 'twinkle 2s ease-in-out infinite',
                            animationDelay: '1.3s' 
                          }} 
                        />
                      </div>
                    </>
                  )}
                </div>
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
          <div className="relative">
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
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              onKeyDown={handleKeyDown}
              className="min-h-[80px] max-h-[240px] resize-none overflow-y-auto pr-10"
              style={{
                height: description ? 'auto' : undefined,
                minHeight: '80px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 240)}px`
              }}
            />
            {description.trim() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImproveBrief}
                    disabled={isDescriptionAILoading}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          isDescriptionAILoading 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: isDescriptionAILoading 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for description */}
                      {isDescriptionAILoading && (
                        <div className="absolute -inset-2 opacity-75 pointer-events-none">
                          <div 
                            className="absolute -top-1 -left-1 w-0.5 h-0.5 bg-primary/60 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0s' 
                            }} 
                          />
                          <div 
                            className="absolute -top-0.5 -right-1 w-0.5 h-0.5 bg-primary/40 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0.7s' 
                            }} 
                          />
                          <div 
                            className="absolute -bottom-0.5 -left-0.5 w-0.5 h-0.5 bg-primary/80 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '1.4s' 
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDescriptionAILoading ? 'AI açıklamayı geliştiriyor...' : 'AI ile açıklamayı geliştir'}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
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
              
              {/* AI Etiket Önerisi Butonu */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggestTags}
                    disabled={isTagAILoading || !title.trim()}
                    className="h-6 w-6 p-0 ml-1"
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          isTagAILoading 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-muted-foreground hover:text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: isTagAILoading 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for tag suggestion */}
                      {isTagAILoading && (
                        <div className="absolute -inset-2 opacity-75 pointer-events-none">
                          <div 
                            className="absolute -top-1 -left-1 w-0.5 h-0.5 bg-primary/60 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0s' 
                            }} 
                          />
                          <div 
                            className="absolute -top-0.5 -right-1 w-0.5 h-0.5 bg-primary/40 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0.7s' 
                            }} 
                          />
                          <div 
                            className="absolute -bottom-0.5 -left-0.5 w-0.5 h-0.5 bg-primary/80 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '1.4s' 
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTagAILoading ? 'AI etiket önerileri oluşturuyor...' : 'AI etiket önerileri'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          
          {/* AI Etiket Butonu - Etiket yoksa */}
          {selectedTags.length === 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Etiket yok</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggestTags}
                    disabled={isTagAILoading || !title.trim()}
                    className="h-6 w-6 p-0"
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          isTagAILoading 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-muted-foreground hover:text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: isTagAILoading 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for tag suggestion */}
                      {isTagAILoading && (
                        <div className="absolute -inset-2 opacity-75 pointer-events-none">
                          <div 
                            className="absolute -top-1 -left-1 w-0.5 h-0.5 bg-primary/60 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0s' 
                            }} 
                          />
                          <div 
                            className="absolute -top-0.5 -right-1 w-0.5 h-0.5 bg-primary/40 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '0.7s' 
                            }} 
                          />
                          <div 
                            className="absolute -bottom-0.5 -left-0.5 w-0.5 h-0.5 bg-primary/80 rounded-full"
                            style={{ 
                              animation: 'twinkle 2s ease-in-out infinite',
                              animationDelay: '1.4s' 
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isTagAILoading ? 'AI etiket önerileri oluşturuyor...' : 'AI etiket önerileri'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Date Button */}
              <div className="relative group">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {getDisplayDate()}
                </Button>
                {selectedDate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDate(null)
                          setSelectedTime(null) // Tarih temizlendiğinde saati de temizle
                          setShowDatePicker(false)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tarihi Temizle</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 z-50">
                    <DatePicker
                      initialDate={selectedDate}
                      onSave={handleDateSave}
                      onCancel={handleDateCancel}
                      isModal={true}
                      parentTaskDueDate={parentTaskId ? (() => {
                        const parentTask = getTaskById(parentTaskId)
                        return parentTask?.dueDate ? new Date(parentTask.dueDate) : null
                      })() : null}
                    />
                  </div>
                )}
              </div>

              {/* Time Button - Sadece tarih seçilmişse göster */}
              {selectedDate && (
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimePicker(!showTimePicker)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {getDisplayTime()}
                  </Button>
                  {selectedTime && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTime(null)
                            setShowTimePicker(false)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Saati Temizle</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Time Picker Dropdown */}
                  {showTimePicker && (
                    <div className="absolute top-full left-0 mt-1 z-50">
                      <TimePicker
                        initialTime={selectedTime}
                        onSave={handleTimeSave}
                        onCancel={handleTimeCancel}
                        isModal={true}
                      />
                    </div>
                  )}
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
                          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full min-w-3 h-3 flex items-center justify-center px-0.5">
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
              
            </div>
          </div>

          {/* Project and Section Selection - Only show for PROJECT tasks */}
          {(!defaultTaskType || defaultTaskType === 'PROJECT') && (
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
              disabled={!title.trim() || 
                       (defaultTaskType !== 'QUICK_NOTE' && defaultTaskType !== 'CALENDAR' && (!selectedProject || !selectedSection)) || 
                       isSubmitting}
            >
              {isSubmitting ? (editingTask ? "Güncelleniyor..." : "Ekleniyor...") : 
               editingTask ? "Görevi Güncelle" :
               parentTaskId ? "Alt Görev Ekle" : "Görev Ekle"}
            </Button>
          </div>
          )}
          
          {/* For QUICK_NOTE and CALENDAR tasks, show simple save button */}
          {(defaultTaskType === 'QUICK_NOTE' || defaultTaskType === 'CALENDAR') && (
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={!title.trim() || isSubmitting}
              >
                {isSubmitting ? "Ekleniyor..." : "Hızlı Not Ekle"}
              </Button>
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>
      
      {/* Info Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] top-[10%] translate-y-0">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <Info className="h-6 w-6 text-primary" />
            <span>Görev Ekleme Rehberi</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Görev ekleme özelliklerini öğrenmek için rehber
          </DialogDescription>
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
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-primary">AI Yardımcı</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Modal başlığındaki AI butonuna tıklayın</p>
                <p>• Seçili proje, bölüm ve üst görev bilgilerine göre otomatik önerir</p>
                <p>• Başlık, açıklama, öncelik ve etiketleri otomatik doldurur</p>
                <p>• Önerilen içerikleri daha sonra düzenleyebilirsiniz</p>
              </div>
            </section>

            {/* Alt Görev Bilgisi */}
            {parentTaskId && parentTask && (
              <section className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h3 className="font-medium text-primary">Alt Görev Ekleme</h3>
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
                  <div className="bg-secondary/20 p-3 rounded-lg">
                    <p className="text-secondary-foreground font-medium">📋 Önemli Kurallar:</p>
                    <ul className="mt-2 space-y-1 text-secondary-foreground">
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
                <Calendar className="h-4 w-4 text-accent-foreground" />
                <h3 className="font-medium text-accent-foreground">Tarih ve Saat</h3>
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
                <Tag className="h-4 w-4 text-primary" />
                <h3 className="font-medium text-primary">Etiket ve Öncelik</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pl-6">
                <p>• Etiket ikonu ile görevleri kategorilere ayırabilirsiniz</p>
                <p>• Bayrak ikonu ile öncelik seviyesi belirleyebilirsiniz</p>
                <p>• Öncelik renkleri: Kritik (kırmızı), Yüksek (turuncu), Orta (sarı), Düşük (mavi)</p>
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