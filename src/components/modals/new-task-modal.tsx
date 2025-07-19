"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Calendar, Clock, Copy, Star, ChevronRight, Plus, ChevronLeft, Tag, Check, Search, Flag, Bell } from "lucide-react"
import { BRAND_COLOR } from "@/lib/constants"
import { useTagStore } from "@/store/tagStore"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, description: string, projectId: string) => void
}

export function NewTaskModal({ isOpen, onClose, onSave }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProject, setSelectedProject] = useState("Proje 1")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeInput, setTimeInput] = useState("")
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchInput, setTagSearchInput] = useState("")
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<string>("Yok")
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [reminders, setReminders] = useState<string[]>([])
  const [showReminderCalendar, setShowReminderCalendar] = useState(false)
  const [reminderDate, setReminderDate] = useState<string | null>(null)
  const [reminderTime, setReminderTime] = useState<string>("")
  const [reminderMonth, setReminderMonth] = useState(6) // Temmuz
  const [reminderYear, setReminderYear] = useState(2025)
  const { tags, fetchTags, createTag } = useTagStore()
  const [currentMonth, setCurrentMonth] = useState(6) // 0-11 (Temmuz = 6)
  const [currentYear, setCurrentYear] = useState(2025)

  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setDescription("")
      setSelectedProject("Proje 1")
      setShowDatePicker(false)
      setShowCalendar(false)
      setShowTimePicker(false)
      setShowTimeInput(false)
      setShowTagPicker(false)
      setSelectedTags([])
      setTagSearchInput("")
      setShowPriorityPicker(false)
      setSelectedPriority("Yok")
      setShowReminderPicker(false)
      setReminders([])
      setShowReminderCalendar(false)
      setReminderDate(null)
      setReminderTime("")
      setReminderMonth(6)
      setReminderYear(2025)
      setSelectedDate(null)
      setSelectedTime(null)
      setTimeInput("")
      setCurrentMonth(6) // Temmuz
      setCurrentYear(2025)
      fetchTags() // Fetch real tags data
    }
  }, [isOpen, fetchTags])

  const handleDateSelect = (dateOption: string) => {
    if (dateOption === "Bugün") {
      const today = new Date()
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`
      setSelectedDate(formattedDate)
    } else if (dateOption === "Yarın") {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const formattedDate = `${tomorrow.getDate().toString().padStart(2, '0')}.${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}.${tomorrow.getFullYear()}`
      setSelectedDate(formattedDate)
    } else if (dateOption === "Sonraki hafta") {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const formattedDate = `${nextWeek.getDate().toString().padStart(2, '0')}.${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}.${nextWeek.getFullYear()}`
      setSelectedDate(formattedDate)
    } else {
      setSelectedDate(dateOption)
    }
    setShowDatePicker(false)
    setShowCalendar(false)
  }

  const handleCustomDateClick = () => {
    setShowCalendar(true)
  }

  const handleCalendarDateSelect = (day: number) => {
    const formattedDate = `${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`
    setSelectedDate(formattedDate)
    setShowDatePicker(false)
    setShowCalendar(false)
  }

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]
    return monthNames[month]
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const handleTimeConfirm = () => {
    if (timeInput.trim()) {
      // Eğer tarih seçilmemişse bugünün tarihini seç
      if (!selectedDate) {
        const today = new Date()
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`
        setSelectedDate(formattedDate)
      }
      setSelectedTime(timeInput.trim())
      setShowTimeInput(false)
      setShowDatePicker(false)
    }
  }

  const handleTimeClear = () => {
    setSelectedTime(null)
    setSelectedDate(null)
    setTimeInput("")
    setShowTimeInput(false)
    setShowDatePicker(false)
  }

  const handleTimeButtonClick = () => {
    // Şu anki saati input'a koy
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setTimeInput(currentTime)
    setShowTimeInput(true)
  }

  const formatTimeInput = (value: string) => {
    // Sadece sayıları al
    const numbers = value.replace(/\D/g, '')
    
    // Maksimum 4 karakter
    const truncated = numbers.slice(0, 4)
    
    // Maskeleme uygula
    if (truncated.length >= 3) {
      return `${truncated.slice(0, 2)}:${truncated.slice(2)}`
    } else if (truncated.length >= 1) {
      return truncated
    }
    return ''
  }

  const formatReminderTimeInput = (value: string) => {
    // Sadece sayıları al
    const numbers = value.replace(/\D/g, '')
    
    // Maksimum 4 karakter
    const truncated = numbers.slice(0, 4)
    
    // Maskeleme uygula
    if (truncated.length >= 3) {
      return `${truncated.slice(0, 2)}:${truncated.slice(2)}`
    } else if (truncated.length >= 1) {
      return truncated
    }
    return ''
  }

  const getDisplayDateTime = () => {
    if (selectedDate && selectedTime) {
      return `${selectedDate} ${selectedTime}`
    } else if (selectedDate) {
      return selectedDate
    } else if (selectedTime) {
      return selectedTime
    }
    return "Zamanla"
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleCreateTag = async () => {
    if (tagSearchInput.trim() && !tags.find(tag => tag.name.toLowerCase() === tagSearchInput.trim().toLowerCase())) {
      const newTag = tagSearchInput.trim()
      try {
        // Create tag in backend and add to store
        await createTag(newTag, "#3b82f6") // Default blue color
        setSelectedTags(prev => [...prev, newTag])
        setTagSearchInput("")
      } catch (error) {
        console.error("Failed to create tag:", error)
      }
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag()
    }
  }

  const handleTagConfirm = () => {
    setShowTagPicker(false)
  }

  const handleTagClear = () => {
    setSelectedTags([])
    setShowTagPicker(false)
  }

  const getFilteredTags = () => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearchInput.toLowerCase())
    )
  }

  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName)
    return tag?.color ? `bg-[${tag.color}]` : "bg-blue-500"
  }

  const priorities = [
    { name: "Kritik", color: "#ef4444", emoji: "🔴" },
    { name: "Yüksek", color: "#f97316", emoji: "🟠" },
    { name: "Orta", color: "#3b82f6", emoji: "🔵" },
    { name: "Düşük", color: "#8b5cf6", emoji: "🟣" },
    { name: "Yok", color: "#9ca3af", emoji: "⚪️" }
  ]

  const handlePrioritySelect = (priority: string) => {
    setSelectedPriority(priority)
    setShowPriorityPicker(false)
  }

  const getPriorityColor = () => {
    const priority = priorities.find(p => p.name === selectedPriority)
    return priority?.color || "#9ca3af"
  }

  const handleAddReminder = () => {
    setShowReminderCalendar(true)
    // Şu anki saati default olarak koy
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setReminderTime(currentTime)
  }

  const handleRemoveReminder = (index: number) => {
    setReminders(prev => prev.filter((_, i) => i !== index))
  }

  const handleReminderPreviousMonth = () => {
    if (reminderMonth === 0) {
      setReminderMonth(11)
      setReminderYear(reminderYear - 1)
    } else {
      setReminderMonth(reminderMonth - 1)
    }
  }

  const handleReminderNextMonth = () => {
    if (reminderMonth === 11) {
      setReminderMonth(0)
      setReminderYear(reminderYear + 1)
    } else {
      setReminderMonth(reminderMonth + 1)
    }
  }

  const handleReminderDateSelect = (day: number) => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]
    setReminderDate(`${day} ${monthNames[reminderMonth]} ${reminderYear}`)
  }

  const handleConfirmReminder = () => {
    if (reminderDate && reminderTime) {
      const reminderText = `${reminderDate} ${reminderTime}`
      setReminders(prev => [...prev, reminderText])
      setShowReminderCalendar(false)
      setReminderDate(null)
      setReminderTime("")
    }
  }

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), description.trim(), "temp-project-id")
      onClose()
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
        <DialogContent className="sm:max-w-lg top-[20%] translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">🎯  Görev Ekle</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
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
              {(selectedDate || selectedTime) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDate(null)
                        setSelectedTime(null)
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
              
              {/* Date Picker Dropdown */}
              {showDatePicker && !showCalendar && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 p-3">
                  <div className="space-y-2">
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Bugün")}
                    >
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Bugün</span>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Yarın")}
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Yarın</span>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Sonraki hafta")}
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Sonraki hafta</span>
                    </div>
                    <div 
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={handleCustomDateClick}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Tarih seçiniz</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Yinele</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <div 
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={!showTimeInput ? handleTimeButtonClick : undefined}
                    >
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Zaman</span>
                      </div>
                      {!showTimeInput ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={timeInput}
                            onChange={(e) => setTimeInput(formatTimeInput(e.target.value))}
                            placeholder="__:__"
                            className="w-16 h-6 text-xs text-center"
                            maxLength={5}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleTimeClear}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {showTimeInput && (
                      <div className="flex space-x-2 px-2 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTimeClear}
                          className="flex-1"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleTimeConfirm}
                          className="flex-1"
                        >
                          Tamamlandı
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Calendar Dropdown */}
              {showDatePicker && showCalendar && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-background border rounded-lg shadow-lg z-50 p-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCalendar(false)}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{getMonthName(currentMonth)} {currentYear}</span>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={handlePreviousMonth}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={handleNextMonth}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="w-8"></div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="space-y-2">
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center">
                      <div>Pzt</div>
                      <div>Sal</div>
                      <div>Çşb</div>
                      <div>Per</div>
                      <div>Cum</div>
                      <div>Cts</div>
                      <div>Pzr</div>
                    </div>

                    {/* Calendar dates */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => i + 1).map((day) => (
                        <Button
                          key={day}
                          variant={day === 10 && currentMonth === 6 ? "default" : "ghost"}
                          size="sm"
                          className={`h-8 w-8 text-xs ${day === 18 && currentMonth === 6 ? 'text-green-600' : ''}`}
                          onClick={() => handleCalendarDateSelect(day)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowTagPicker(!showTagPicker)}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Etiketler</p>
                  </TooltipContent>
                </Tooltip>

                {/* Tag Picker Dropdown */}
                {showTagPicker && (
                  <div className="absolute top-full right-0 mt-1 w-72 bg-background border rounded-lg shadow-lg z-50 p-3">
                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        value={tagSearchInput}
                        onChange={(e) => setTagSearchInput(e.target.value)}
                        onKeyPress={handleTagKeyPress}
                        placeholder="Ara veya Oluştur"
                        className="pl-8 h-8 text-xs"
                      />
                    </div>

                    {/* Tag List */}
                    <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                      {getFilteredTags().map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handleTagToggle(tag.name)}
                        >
                          <div className={`w-3 h-3 rounded border ${
                            selectedTags.includes(tag.name) 
                              ? 'bg-purple-600 border-purple-600' 
                              : 'border-gray-400'
                          } flex items-center justify-center`}>
                            {selectedTags.includes(tag.name) && (
                              <Check className="h-2 w-2 text-white" />
                            )}
                          </div>
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className="text-xs">{tag.name}</span>
                        </div>
                      ))}

                      {/* Create New Tag */}
                      {tagSearchInput && !tags.some(tag => 
                        tag.name.toLowerCase() === tagSearchInput.toLowerCase()
                      ) && (
                        <div
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={handleCreateTag}
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Create '{tagSearchInput}'</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        onClick={handleTagClear}
                        className="flex-1 h-7 text-xs"
                        size="sm"
                      >
                        Temizle
                      </Button>
                      <Button
                        onClick={handleTagConfirm}
                        className="flex-1 h-7 text-xs"
                        size="sm"
                      >
                        Tamamlandı
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                      style={{ color: getPriorityColor() }}
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Öncelik</p>
                  </TooltipContent>
                </Tooltip>

                {/* Priority Picker Dropdown */}
                {showPriorityPicker && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-background border rounded-lg shadow-lg z-50 p-1">
                    <div>
                      {priorities.map((priority) => (
                        <div
                          key={priority.name}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => handlePrioritySelect(priority.name)}
                        >
                          <span className="text-sm">{priority.emoji}</span>
                          <span className="text-xs">{priority.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowReminderPicker(!showReminderPicker)}
                      className="relative"
                    >
                      <Bell className="h-4 w-4" />
                      {reminders.length > 0 && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hatırlatıcılar</p>
                  </TooltipContent>
                </Tooltip>

                {/* Reminder Picker Dropdown */}
                {showReminderPicker && !showReminderCalendar && (
                  <div className="absolute top-full right-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Hatırlatıcılar</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddReminder}
                        className="h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {reminders.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          Hatırlatıcılar listeniz burada görünecek. '+' düğmesine tıklayarak bir tane ekleyin
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {reminders.map((reminder, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{reminder}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveReminder(index)}
                              className="h-5 w-5"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="mt-3 pt-2 border-t">
                      <Button
                        onClick={() => setShowReminderPicker(false)}
                        className="w-full h-7 text-xs"
                        size="sm"
                      >
                        Tamamlandı
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reminder Calendar Dropdown */}
                {showReminderCalendar && (
                  <div className="absolute top-full right-0 mt-1 w-80 bg-background border rounded-lg shadow-lg z-50 p-4">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowReminderCalendar(false)}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{getMonthName(reminderMonth)} {reminderYear}</span>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={handleReminderPreviousMonth}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={handleReminderNextMonth}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-8"></div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="space-y-2 mb-4">
                      {/* Days of week */}
                      <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground text-center">
                        <div>Pzt</div>
                        <div>Sal</div>
                        <div>Çşb</div>
                        <div>Per</div>
                        <div>Cum</div>
                        <div>Cts</div>
                        <div>Pzr</div>
                      </div>

                      {/* Calendar dates */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getDaysInMonth(reminderMonth, reminderYear) }, (_, i) => i + 1).map((day) => (
                          <Button
                            key={day}
                            variant={reminderDate?.includes(`${day} `) ? "default" : "ghost"}
                            size="sm"
                            className="h-8 w-8 text-xs"
                            onClick={() => handleReminderDateSelect(day)}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Time Input */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={reminderTime}
                          onChange={(e) => setReminderTime(formatReminderTimeInput(e.target.value))}
                          placeholder="__:__"
                          className="flex-1 text-center"
                          maxLength={5}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={handleConfirmReminder}
                      disabled={!reminderDate || !reminderTime}
                      className="w-full"
                      style={{ backgroundColor: "#8b5cf6" }}
                    >
                      Hatırlatıcı Ekle
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Selection and Save Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>{selectedProject}</span>
              <span>→</span>
              <span>Bölüm Yok</span>
              <Button
                variant="ghost"
                size="sm"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
            >
              Yapılacak Ekle
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}