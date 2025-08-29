"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
  const [loadingStates, setLoadingStates] = useState({
    aiSuggestion: false,
    titleImprovement: false,
    descriptionImprovement: false,
    tagSuggestion: false
  })
  const [aiPrompt, setAiPrompt] = useState("yap")
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: "",
    message: ""
  })

  // Modal açıldığında sadece bir kez data fetch et - paralel olarak
  useEffect(() => {
    if (isOpen) {
      // Paralel fetch işlemleri - async/await kullanmadan Promise.all ile
      const fetchPromises = []
      
      if (tags.length === 0) {
        fetchPromises.push(fetchTags())
      }
      if (projects.length === 0) {
        fetchPromises.push(fetchProjects())
      }
      
      // Tüm fetch işlemlerini paralel başlat
      if (fetchPromises.length > 0) {
        Promise.allSettled(fetchPromises).then(() => {
          console.log('📡 Initial data fetch completed')
        })
      }
    }
    
    // Cleanup timeout on unmount or modal close
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [isOpen, tags.length, projects.length, fetchTags, fetchProjects])

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Focus title input when modal opens
      const timer = setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100) // Small delay to ensure modal is fully rendered
      
      return () => clearTimeout(timer)
    }
  }, [isOpen])


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
      setLoadingStates({
        aiSuggestion: false,
        titleImprovement: false,
        descriptionImprovement: false,
        tagSuggestion: false
      })
      setAiPrompt("yap")
    }
  }, [isOpen, editingTask]) // tags.length, projects.length kaldırıldı

  // Store'dan sections al - memoized
  const sections = useMemo(() => {
    return selectedProject ? getSectionsByProject(selectedProject.id) : []
  }, [selectedProject, getSectionsByProject])

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

  const getFilteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.name.toLowerCase().includes(projectSearchInput.toLowerCase())
    )
  }, [projects, projectSearchInput])

  const getFilteredSections = useMemo(() => {
    return sections.filter(section => 
      section.name.toLowerCase().includes(sectionSearchInput.toLowerCase())
    )
  }, [sections, sectionSearchInput])


  // AI çağrıları için throttling/debouncing
  const debouncedAICall = (fn: () => Promise<void>, delay: number = 1000) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fn()
    }, delay)
  }

  // Smart random date generation considering parent task constraints
  const generateRandomDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 14) // Default 14 days
    
    // Parent task kısıtlaması varsa onu dikkate al
    if (parentTaskId && parentTask?.dueDate) {
      const parentDueDate = new Date(parentTask.dueDate)
      parentDueDate.setHours(23, 59, 59, 999) // Parent task'ın gün sonuna kadar
      
      // Parent task tarihinden önceki bir tarihi max olarak kullan
      if (parentDueDate > today) {
        maxDate = new Date(Math.min(maxDate.getTime(), parentDueDate.getTime()))
      }
    }
    
    // Bugün ile max date arasında rastgele tarih seç
    const diffTime = maxDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) {
      // Eğer uygun tarih yoksa, bugünü kullan
      return { dateStr: `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`, maxDiffDays: 0 }
    }
    
    const randomDays = Math.floor(Math.random() * diffDays) + 1
    const randomDate = new Date(today)
    randomDate.setDate(today.getDate() + randomDays)
    
    const dateStr = `${randomDate.getDate().toString().padStart(2, '0')}.${(randomDate.getMonth() + 1).toString().padStart(2, '0')}.${randomDate.getFullYear()}`
    return { dateStr, maxDiffDays: diffDays }
  }

  const validateForm = () => {
    // Başlık validasyonu
    if (!title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Geçersiz Başlık",
        message: "Görev başlığı boş olamaz."
      })
      return false
    }
    
    if (title.trim().length > 255) {
      setAlertConfig({
        isOpen: true,
        title: "Başlık Çok Uzun",
        message: "Görev başlığı 255 karakterden fazla olamaz."
      })
      return false
    }
    
    // Açıklama validasyonu
    if (description && description.length > 5000) {
      setAlertConfig({
        isOpen: true,
        title: "Açıklama Çok Uzun",
        message: "Görev açıklaması 5000 karakterden fazla olamaz."
      })
      return false
    }
    
    // Proje ve bölüm validasyonu (QUICK_NOTE ve CALENDAR hariç)
    if (defaultTaskType !== 'QUICK_NOTE' && defaultTaskType !== 'CALENDAR') {
      if (!selectedProject) {
        setAlertConfig({
          isOpen: true,
          title: "Proje Seçilmedi",
          message: "Lütfen bir proje seçin."
        })
        return false
      }
      
      if (!selectedSection) {
        setAlertConfig({
          isOpen: true,
          title: "Bölüm Seçilmedi",
          message: "Lütfen bir bölüm seçin."
        })
        return false
      }
    }
    
    // Tarih validasyonu
    if (selectedDate) {
      try {
        const [day, month, year] = selectedDate.split('.')
        const selectedDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        
        // Geçmiş tarih kontrolü (bugünden önceki tarihler)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDateTime < today) {
          setAlertConfig({
            isOpen: true,
            title: "Geçersiz Tarih",
            message: "Görev tarihi bugünden önce olamaz."
          })
          return false
        }
        
        // Parent task tarih kısıtlaması
        if (parentTaskId && parentTask?.dueDate) {
          const parentDueDate = new Date(parentTask.dueDate)
          parentDueDate.setHours(23, 59, 59, 999) // Parent task'ın gün sonuna kadar izin ver
          
          if (combineDateTime()) {
            const childDueDate = new Date(combineDateTime()!)
            if (childDueDate > parentDueDate) {
              setAlertConfig({
                isOpen: true,
                title: "Tarih Kısıtlaması",
                message: "Alt görev, üst görevden daha geç bitirilemez."
              })
              return false
            }
          }
        }
      } catch (error) {
        setAlertConfig({
          isOpen: true,
          title: "Geçersiz Tarih",
          message: "Lütfen geçerli bir tarih girin."
        })
        return false
      }
    }
    
    // Etiket sayısı validasyonu
    if (selectedTags.length > 10) {
      setAlertConfig({
        isOpen: true,
        title: "Çok Fazla Etiket",
        message: "En fazla 10 etiket seçebilirsiniz."
      })
      return false
    }
    
    // Parent-child kısıtlamaları
    if (parentTaskId && parentTask) {
      // Level kontrolü - Level 4+ görevlerde alt görev oluşturulamaz
      if (parentTask.level >= 4) {
        setAlertConfig({
          isOpen: true,
          title: "Görev Seviye Kısıtlaması",
          message: "Seviye 4 ve üzeri görevlerde alt görev oluşturulamaz. Alt görevlerin maksimum seviyesi 4'tür."
        })
        return false
      }
      
      // Parent görev tamamlanmışsa alt görev oluşturulamaz
      if (parentTask.completed) {
        setAlertConfig({
          isOpen: true,
          title: "Tamamlanmış Görev",
          message: "Tamamlanmış görevlere alt görev eklenemez."
        })
        return false
      }
    }
    
    return true
  }

  const handleSave = async () => {
    console.log('💾 Task kaydetme işlemi başladı:', { 
      title: title.trim(), 
      selectedProject, 
      selectedSection, 
      parentTaskId 
    })
    
    // Form validasyonu
    if (!validateForm()) {
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
      console.error('Task save error:', error)
      setAlertConfig({
        isOpen: true,
        title: "Görev Kaydetme Hatası",
        message: error instanceof Error ? error.message : "Görev kaydedilirken bir hata oluştu. Lütfen tekrar deneyin."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  // AI yardımcı fonksiyonları
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setLoadingStates(prev => ({ ...prev, aiSuggestion: true }))
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
      
      // Rastgele seçilen özellikleri uygula - Öncelik
      if (suggestion.priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NONE"].includes(suggestion.priority)) {
        setSelectedPriority(suggestion.priority)
      } else {
        // AI öncelik önermediyse veya geçersizse, rastgele bir öncelik seç
        const priorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NONE"]
        const randomPriority = priorityValues[Math.floor(Math.random() * priorityValues.length)]
        setSelectedPriority(randomPriority)
      }
      
      // Etiket ata - AI önerisi varsa kullan, yoksa rastgele seç
      if (suggestion.tags && suggestion.tags.length > 0) {
        setSelectedTags(suggestion.tags)
      } else if (tags.length > 0) {
        // AI etiket önermediyse, mevcut etiketlerden rastgele 1-3 tane seç
        const shuffledTags = [...tags].sort(() => 0.5 - Math.random())
        const randomCount = Math.floor(Math.random() * 3) + 1 // 1-3 arası
        const selectedRandomTags = shuffledTags.slice(0, Math.min(randomCount, tags.length))
        setSelectedTags(selectedRandomTags.map(tag => tag.name))
      }
      
      if (suggestion.dueDate) {
        try {
          // Suggestion'dan gelen ISO string'i tarih ve saat olarak ayır
          const date = new Date(suggestion.dueDate)
          
          // Parent task kısıtlaması kontrolü
          let isValidDate = true
          if (parentTaskId && parentTask?.dueDate) {
            const parentDueDate = new Date(parentTask.dueDate)
            parentDueDate.setHours(23, 59, 59, 999)
            if (date > parentDueDate) {
              isValidDate = false
            }
          }
          
          if (isValidDate && date >= new Date()) {
            const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
            setSelectedDate(dateStr)
            
            // All-day event değilse saati de set et
            const isAllDayEvent = suggestion.dueDate.includes('T00:00:00.000Z')
            if (!isAllDayEvent) {
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
              setSelectedTime(timeStr)
            }
          } else {
            // AI tarihi uygun değilse smart rastgele tarih ata
            const { dateStr, maxDiffDays } = generateRandomDate()
            setSelectedDate(dateStr)
            if (maxDiffDays > 0) {
              const randomHour = Math.floor(Math.random() * 10) + 9
              const randomMinute = Math.floor(Math.random() * 4) * 15
              const timeStr = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`
              setSelectedTime(timeStr)
            }
          }
        } catch (dateError) {
          console.error('AI tarih parse hatası:', dateError)
          // Hatalı AI tarihi durumunda smart rastgele tarih ata
          const { dateStr } = generateRandomDate()
          setSelectedDate(dateStr)
        }
      } else {
        // AI tarih önermediyse smart rastgele gelecek tarih ata
        const { dateStr, maxDiffDays } = generateRandomDate()
        setSelectedDate(dateStr)
        
        // Rastgele saat de ata (9-18 arası) - sadece birden fazla gün varsa
        if (maxDiffDays > 0) {
          const randomHour = Math.floor(Math.random() * 10) + 9
          const randomMinute = Math.floor(Math.random() * 4) * 15
          const timeStr = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`
          setSelectedTime(timeStr)
        }
      }
      
      
      setAiPrompt("yap")
    } catch (error) {
      console.error('AI generation error:', error)
      setAlertConfig({
        isOpen: true,
        title: "AI Önerisi Hatası",
        message: "AI önerisi alınırken bir hata oluştu. Lütfen tekrar deneyin."
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, aiSuggestion: false }))
    }
  }

  const handleImproveBrief = async () => {
    if (!description.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Açıklama Gerekli",
        message: "AI açıklama iyileştirmesi için önce bir açıklama yazmalısınız."
      })
      return
    }
    
    setLoadingStates(prev => ({ ...prev, descriptionImprovement: true }))
    try {
      const improvedDescription = await improveBrief(description)
      if (!improvedDescription || improvedDescription.trim() === description.trim()) {
        setAlertConfig({
          isOpen: true,
          title: "İyileştirme Bulunamadı",
          message: "AI açıklamanızda herhangi bir iyileştirme önerisi bulamadı. Mevcut açıklama zaten yeterince iyi görünüyor."
        })
      } else {
        setDescription(improvedDescription)
        // Success feedback
        window.dispatchEvent(new CustomEvent('quickTaskSuccess', {
          detail: { message: "Açıklama AI tarafından iyileştirildi!" }
        }))
      }
    } catch (error) {
      console.error('Description improvement error:', error)
      setAlertConfig({
        isOpen: true,
        title: "Açıklama İyileştirme Hatası",
        message: error instanceof Error && error.message.includes('network') 
          ? "İnternet bağlantınızı kontrol edip tekrar deneyin."
          : "Açıklama iyileştirme sırasında bir hata oluştu. Lütfen tekrar deneyin."
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, descriptionImprovement: false }))
    }
  }

  const handleImproveTitle = () => {
    if (!title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Başlık Gerekli",
        message: "AI başlık iyileştirmesi için önce bir başlık yazmalısınız."
      })
      return
    }
    
    // Debounced AI call
    debouncedAICall(async () => {
      setLoadingStates(prev => ({ ...prev, titleImprovement: true }))
      try {
        const improvedTitle = await improveTitle(title)
        if (!improvedTitle || improvedTitle.trim() === title.trim()) {
          setAlertConfig({
            isOpen: true,
            title: "İyileştirme Bulunamadı",
            message: "AI başlığınızda herhangi bir iyileştirme önerisi bulamadı. Mevcut başlık zaten yeterince iyi görünüyor."
          })
        } else {
          setTitle(improvedTitle)
          // Success feedback
          window.dispatchEvent(new CustomEvent('quickTaskSuccess', {
            detail: { message: "Başlık AI tarafından iyileştirildi!" }
          }))
        }
      } catch (error) {
        console.error('Title improvement error:', error)
        setAlertConfig({
          isOpen: true,
          title: "Başlık İyileştirme Hatası",
          message: error instanceof Error && error.message.includes('network')
            ? "İnternet bağlantınızı kontrol edip tekrar deneyin."
            : "Başlık iyileştirme sırasında bir hata oluştu. Lütfen tekrar deneyin."
        })
      } finally {
        setLoadingStates(prev => ({ ...prev, titleImprovement: false }))
      }
    }, 800)
  }

  const handleAISuggestTags = () => {
    if (!title.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Başlık Gerekli",
        message: "AI etiket önerisi için önce bir başlık girmelisiniz."
      })
      return
    }
    
    // Debounced AI call for tag suggestions
    debouncedAICall(async () => {
      setLoadingStates(prev => ({ ...prev, tagSuggestion: true }))
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
        
        // 10 etiket limitini kontrol et
        if (uniqueTags.length > 10) {
          setAlertConfig({
            isOpen: true,
            title: "Etiket Limiti",
            message: `AI ${data.tags.length} etiket önerdi, ancak maksimum 10 etiket seçilebilir. İlk ${10 - selectedTags.length} etiket eklendi.`
          })
          setSelectedTags([...selectedTags, ...newTagNames.slice(0, 10 - selectedTags.length)])
        } else {
          setSelectedTags(uniqueTags)
        }
        
        // TagStore'u güncelle (yeni etiketler eklenmişse)
        await fetchTags()
        
        // Success feedback
        window.dispatchEvent(new CustomEvent('quickTaskSuccess', {
          detail: { message: `${Math.min(newTagNames.length, 10 - selectedTags.length)} AI etiket önerisi eklendi!` }
        }))
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Öneri Bulunamadı",
          message: "AI bu başlık için uygun etiket önerisi bulamadı. Farklı bir başlık deneyin veya etiketleri manuel olarak ekleyin."
        })
      }
    } catch (error) {
      console.error('Tag suggestion error:', error)
      setAlertConfig({
        isOpen: true,
        title: "Etiket Önerisi Hatası",
        message: error instanceof Error && error.message.includes('network')
          ? "İnternet bağlantınızı kontrol edip tekrar deneyin."
          : "AI etiket önerisi alınırken bir hata oluştu. Lütfen tekrar deneyin."
      })
      } finally {
        setLoadingStates(prev => ({ ...prev, tagSuggestion: false }))
      }
    }, 600)
  }

  const handleQuickAIGenerate = async () => {
    setLoadingStates(prev => ({ ...prev, aiSuggestion: true }))
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
      
      // Öncelik ata - AI önerisi varsa kullan, yoksa rastgele ata
      if (suggestion.priority && ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NONE"].includes(suggestion.priority)) {
        setSelectedPriority(suggestion.priority)
      } else {
        // AI öncelik önermediyse veya geçersizse, rastgele bir öncelik seç
        const priorityValues = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "NONE"]
        const randomPriority = priorityValues[Math.floor(Math.random() * priorityValues.length)]
        setSelectedPriority(randomPriority)
      }
      
      // Etiket ata - AI önerisi varsa kullan, yoksa rastgele seç
      if (suggestion.tags && suggestion.tags.length > 0) {
        setSelectedTags(suggestion.tags)
      } else if (tags.length > 0) {
        // AI etiket önermediyse, mevcut etiketlerden rastgele 1-3 tane seç
        const shuffledTags = [...tags].sort(() => 0.5 - Math.random())
        const randomCount = Math.floor(Math.random() * 3) + 1 // 1-3 arası
        const selectedRandomTags = shuffledTags.slice(0, Math.min(randomCount, tags.length))
        setSelectedTags(selectedRandomTags.map(tag => tag.name))
      }
      
      // Tarih ata - AI önerisi varsa kullan, yoksa rastgele gelecek tarih ata
      if (suggestion.dueDate) {
        try {
          const date = new Date(suggestion.dueDate)
          
          // Parent task kısıtlaması kontrolü
          let isValidDate = true
          if (parentTaskId && parentTask?.dueDate) {
            const parentDueDate = new Date(parentTask.dueDate)
            parentDueDate.setHours(23, 59, 59, 999)
            if (date > parentDueDate) {
              isValidDate = false
            }
          }
          
          if (isValidDate && date >= new Date()) {
            const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
            setSelectedDate(dateStr)
            
            // All-day event değilse saati de set et
            const isAllDayEvent = suggestion.dueDate.includes('T00:00:00.000Z')
            if (!isAllDayEvent) {
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
              setSelectedTime(timeStr)
            }
          } else {
            // AI tarihi uygun değilse smart rastgele tarih ata
            const { dateStr, maxDiffDays } = generateRandomDate()
            setSelectedDate(dateStr)
            if (maxDiffDays > 0) {
              const randomHour = Math.floor(Math.random() * 10) + 9
              const randomMinute = Math.floor(Math.random() * 4) * 15
              const timeStr = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`
              setSelectedTime(timeStr)
            }
          }
        } catch (dateError) {
          console.error('AI tarih parse hatası:', dateError)
          // Hatalı AI tarihi durumunda smart rastgele tarih ata
          const { dateStr } = generateRandomDate()
          setSelectedDate(dateStr)
        }
      } else {
        // AI tarih önermediyse smart rastgele gelecek tarih ata
        const { dateStr, maxDiffDays } = generateRandomDate()
        setSelectedDate(dateStr)
        
        // Rastgele saat de ata (9-18 arası) - sadece birden fazla gün varsa
        if (maxDiffDays > 0) {
          const randomHour = Math.floor(Math.random() * 10) + 9 // 9-18 saat arası
          const randomMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
          const timeStr = `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`
          setSelectedTime(timeStr)
        }
      }
      
    } catch (error) {
      console.error('AI öneri hatası:', error)
      setAlertConfig({
        isOpen: true,
        title: "AI Önerisi Hatası",
        message: "AI önerisi alınırken bir hata oluştu. Lütfen tekrar deneyin."
      })
    } finally {
      setLoadingStates(prev => ({ ...prev, aiSuggestion: false }))
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-2xl top-[10%] translate-y-0" 
          role="dialog" 
          aria-modal="true"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogDescription className="sr-only">
            Yeni görev oluşturmak veya mevcut görevi düzenlemek için form
          </DialogDescription>
          {/* Modal Header with Proper Layout */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <DialogTitle className="text-lg font-semibold leading-relaxed pr-2 flex-1 min-w-0 mb-2">
              {editingTask ? '✏️ Görevi Düzenle' : 
               parentTaskId ? (
                 <div className="flex items-center gap-2">
                   <span>🔗 Alt Görev Ekle</span>
                   {parentTask && (
                     <span className="text-sm text-muted-foreground font-normal">
                       (Seviye {(parentTask.level || 0) + 1})
                     </span>
                   )}
                   {parentTaskTitle && (
                     <span className="text-sm text-muted-foreground font-normal truncate">
                       : {parentTaskTitle}
                     </span>
                   )}
                 </div>
               ) : 
               '🎯 Görev Ekle'}
            </DialogTitle>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickAIGenerate}
                disabled={loadingStates.aiSuggestion}
                className={`h-8 px-3 bg-primary/10 hover:bg-primary/20 transition-all duration-200 ${
                  loadingStates.aiSuggestion ? 'animate-pulse bg-primary/20' : ''
                }`}
                aria-label={loadingStates.aiSuggestion ? "AI görev üretiyor" : "AI ile görev öner"}
                aria-busy={loadingStates.aiSuggestion}
                title={loadingStates.aiSuggestion ? "AI görev üretiyor..." : "AI ile görev öner"}
              >
                <div className="relative flex items-center">
                  <Sparkles 
                    className={`h-4 w-4 text-primary mr-1 transition-all duration-300 ${
                      loadingStates.aiSuggestion 
                        ? 'animate-pulse scale-110 drop-shadow-sm' 
                        : 'hover:scale-105'
                    }`}
                    style={{
                      animation: loadingStates.aiSuggestion 
                        ? 'sparkle 1.5s ease-in-out infinite, pulse 1.5s ease-in-out infinite' 
                        : undefined
                    }}
                  />
                  <span className={`text-xs text-primary transition-all duration-300 ${
                    loadingStates.aiSuggestion ? 'animate-pulse' : ''
                  }`}>
                    {loadingStates.aiSuggestion ? 'Üretiyor...' : 'ai'}
                  </span>
                  
                  {/* Sparkle effect overlay */}
                  {loadingStates.aiSuggestion && (
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
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yapılacak adı"
              onKeyDown={handleKeyDown}
              className={title.length > 255 ? "border-destructive" : ""}
              aria-label="Görev başlığı"
              aria-required="true"
              aria-invalid={title.length > 255}
              aria-describedby="title-counter title-help"
            />
            <div className="flex justify-end mt-1">
              <span 
                id="title-counter"
                className={`text-xs ${title.length > 255 ? 'text-destructive' : title.length > 200 ? 'text-yellow-600' : 'text-muted-foreground'}`}
                aria-live="polite"
              >
                {title.length}/255
              </span>
            </div>
            <div id="title-help" className="sr-only">
              Görev başlığı maksimum 255 karakter olabilir. Gerekli alan.
            </div>
          </div>

          {/* Description Input */}
          <div className="relative">
            <Textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              onKeyDown={handleKeyDown}
              className={`min-h-[80px] max-h-[240px] resize-none overflow-y-auto pr-10 ${description.length > 5000 ? 'border-destructive' : ''}`}
              style={{
                height: description ? 'auto' : undefined,
                minHeight: '80px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = `${Math.min(target.scrollHeight, 240)}px`
              }}
              aria-label="Görev açıklaması"
              aria-describedby="description-counter description-help"
              aria-invalid={description.length > 5000}
            />
            <div className="flex justify-end mt-1">
              <span 
                id="description-counter"
                className={`text-xs ${description.length > 5000 ? 'text-destructive' : description.length > 4500 ? 'text-yellow-600' : 'text-muted-foreground'}`}
                aria-live="polite"
              >
                {description.length}/5000
              </span>
            </div>
            <div id="description-help" className="sr-only">
              Görev açıklaması maksimum 5000 karakter olabilir. İsteğe bağlı alan.
            </div>
            {description.trim() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImproveBrief}
                    disabled={loadingStates.descriptionImprovement}
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    aria-label={loadingStates.descriptionImprovement ? "AI açıklamayı iyileştiriyor" : "AI ile açıklamayı iyileştir"}
                    aria-busy={loadingStates.descriptionImprovement}
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          loadingStates.descriptionImprovement 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: loadingStates.descriptionImprovement 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for description */}
                      {loadingStates.descriptionImprovement && (
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
                  <p>{loadingStates.descriptionImprovement ? 'AI açıklamayı geliştiriyor...' : 'AI ile açıklamayı geliştir'}</p>
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
                    disabled={loadingStates.tagSuggestion || !title.trim()}
                    className="h-6 w-6 p-0 ml-1"
                    aria-label={loadingStates.tagSuggestion ? "AI etiket önerileri oluşturuyor" : "AI etiket önerileri"}
                    aria-busy={loadingStates.tagSuggestion}
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          loadingStates.tagSuggestion 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-muted-foreground hover:text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: loadingStates.tagSuggestion 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for tag suggestion */}
                      {loadingStates.tagSuggestion && (
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
                  <p>{loadingStates.tagSuggestion ? 'AI etiket önerileri oluşturuyor...' : 'AI etiket önerileri'}</p>
                </TooltipContent>
              </Tooltip>
              {selectedTags.length > 8 && (
                <span className={`text-xs ml-2 ${selectedTags.length >= 10 ? 'text-destructive' : 'text-yellow-600'}`}>
                  {selectedTags.length}/10 etiket
                </span>
              )}
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
                    disabled={loadingStates.tagSuggestion || !title.trim()}
                    className="h-6 w-6 p-0"
                  >
                    <div className="relative">
                      <Sparkles 
                        className={`h-3 w-3 transition-all duration-300 ${
                          loadingStates.tagSuggestion 
                            ? 'text-primary animate-pulse scale-110' 
                            : 'text-muted-foreground hover:text-primary hover:scale-110'
                        }`}
                        style={{
                          animation: loadingStates.tagSuggestion 
                            ? 'sparkle 1.5s ease-in-out infinite' 
                            : undefined
                        }}
                      />
                      {/* Sparkle effect for tag suggestion */}
                      {loadingStates.tagSuggestion && (
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
                  <p>{loadingStates.tagSuggestion ? 'AI etiket önerileri oluşturuyor...' : 'AI etiket önerileri'}</p>
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
                      <li>• Maksimum seviye 4'tür (seviye {(parentTask.level || 0) + 1} oluşturulacak)</li>
                      {(parentTask.level || 0) >= 3 && (
                        <li className="text-yellow-600">⚠️ Bu seviye 4 alt görev olacak - daha fazla alt seviye oluşturulamaz</li>
                      )}
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