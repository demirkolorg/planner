"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Calendar, Clock, Copy, Star, ChevronRight, Plus, ChevronLeft } from "lucide-react"
import { BRAND_COLOR } from "@/lib/constants"

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
      setSelectedDate(null)
      setSelectedTime(null)
      setTimeInput("")
      setCurrentMonth(6) // Temmuz
      setCurrentYear(2025)
    }
  }, [isOpen])

  const handleDateSelect = (dateOption: string) => {
    setSelectedDate(dateOption)
    setShowDatePicker(false)
    setShowCalendar(false)
  }

  const handleCustomDateClick = () => {
    setShowCalendar(true)
  }

  const handleCalendarDateSelect = (day: number) => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]
    setSelectedDate(`${day} ${monthNames[currentMonth]} ${currentYear}`)
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
        setSelectedDate("Bugün")
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
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

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <div className="relative group flex items-center">
              {(selectedDate || selectedTime) && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity mr-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate(null)
                    setSelectedTime(null)
                    setShowDatePicker(false)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {getDisplayDateTime()}
              </Button>
              
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
                            onChange={(e) => setTimeInput(e.target.value)}
                            placeholder="15:55"
                            className="w-16 h-6 text-xs text-center"
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
            <Button
              variant="ghost"
              size="sm"
            >
              <Copy className="h-4 w-4 mr-2" />
              Kopyala
            </Button>
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
  )
}