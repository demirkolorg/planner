"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Clock, X, Star, ChevronRight, ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ValidationAlert } from "@/components/ui/validation-alert"

interface DateTimePickerProps {
  initialDateTime?: string
  onSave: (dateTime: string | null) => void
  onCancel: () => void
  position?: { x: number; y: number }
  isModal?: boolean // Modal kullanımı için
  parentTaskDueDate?: Date | null
}

export function DateTimePicker({ initialDateTime, onSave, onCancel, position, isModal = false, parentTaskDueDate }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [timeInput, setTimeInput] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(6) // 0-11 (Temmuz = 6)
  const [currentYear, setCurrentYear] = useState(2025)
  const containerRef = useRef<HTMLDivElement>(null)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: "",
    message: ""
  })
  const [isTimeConfirmLoading, setIsTimeConfirmLoading] = useState(false)

  useEffect(() => {
    if (initialDateTime) {
      const date = new Date(initialDateTime)
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '.')
      const timeStr = date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      setSelectedDate(dateStr)
      if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        setSelectedTime(timeStr)
      }
    }
  }, [initialDateTime])

  const handleSave = useCallback(() => {
    if (!selectedDate) {
      onSave(null)
      return
    }

    try {
      // DD.MM.YYYY formatını parse et
      const [day, month, year] = selectedDate.split('.')
      
      // Validation
      if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
        throw new Error('Invalid date format')
      }

      const dayNum = parseInt(day)
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)

      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
        throw new Error('Invalid date values')
      }
      
      // Date object oluştur
      let date: Date
      if (selectedTime) {
        const [hours, minutes] = selectedTime.split(':')
        if (!hours || !minutes || hours.length !== 2 || minutes.length !== 2) {
          throw new Error('Invalid time format')
        }
        const hoursNum = parseInt(hours)
        const minutesNum = parseInt(minutes)
        if (hoursNum < 0 || hoursNum > 23 || minutesNum < 0 || minutesNum > 59) {
          throw new Error('Invalid time values')
        }
        date = new Date(yearNum, monthNum - 1, dayNum, hoursNum, minutesNum)
      } else {
        date = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0)
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }

      // Geçmiş tarih kontrolü
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (date < todayStart) {
        setAlertConfig({
          isOpen: true,
          title: "Geçersiz Tarih",
          message: "Geçmiş tarih seçilemez. Lütfen bugünden sonra bir tarih seçin."
        })
        return
      }

      // Parent task bitiş tarihi kontrolü
      if (parentTaskDueDate) {
        // Eğer parent task'ın saati 00:00 ise, gün sonuna kadar (23:59) izin ver
        const parentTaskEndOfDay = parentTaskDueDate.getHours() === 0 && parentTaskDueDate.getMinutes() === 0
          ? new Date(parentTaskDueDate.getFullYear(), parentTaskDueDate.getMonth(), parentTaskDueDate.getDate(), 23, 59, 59)
          : parentTaskDueDate
        
        if (date > parentTaskEndOfDay) {
          const parentDueDateWithTime = parentTaskDueDate.getHours() === 0 && parentTaskDueDate.getMinutes() === 0
            ? parentTaskDueDate.toLocaleDateString('tr-TR')
            : `${parentTaskDueDate.toLocaleDateString('tr-TR')} ${parentTaskDueDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
          
          const selectedDateDisplay = selectedTime 
            ? `${selectedDate} ${selectedTime}`
            : selectedDate
          
          setAlertConfig({
            isOpen: true,
            title: "Tarih Sınırı Aşıldı",
            message: `Alt görevin bitiş tarihi (${selectedDateDisplay}), üst görevin bitiş tarihinden (${parentDueDateWithTime}) sonra olamaz.`
          })
          return
        }
      }

      // ISO string olarak gönder
      onSave(date.toISOString())
    } catch (error) {
      setAlertConfig({
        isOpen: true,
        title: "Geçersiz Format",
        message: "Geçersiz tarih formatı. Lütfen DD.MM.YYYY formatında girin."
      })
    }
  }, [selectedDate, selectedTime, onSave, parentTaskDueDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isModal) {
          handleSave()
        } else {
          onCancel()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isModal, onCancel, handleSave])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

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
    setShowCalendar(false)
  }

  const handleCustomDateClick = () => {
    setShowCalendar(true)
  }

  const handleCalendarDateSelect = (day: number) => {
    const formattedDate = `${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`
    setSelectedDate(formattedDate)
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

  const handleTimeConfirm = async () => {
    if (timeInput.trim()) {
      // Time input validation
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(timeInput.trim())) {
        setAlertConfig({
          isOpen: true,
          title: "Geçersiz Saat",
          message: "Lütfen geçerli bir saat formatı girin (ÖR: 14:30)"
        })
        return
      }
      
      // Visual feedback - show loading state
      setIsTimeConfirmLoading(true)
      
      // Eğer tarih seçilmemişse bugünün tarihini seç
      if (!selectedDate) {
        const today = new Date()
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`
        setSelectedDate(formattedDate)
      }
      
      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setSelectedTime(timeInput.trim())
      setShowTimeInput(false)
      setIsTimeConfirmLoading(false)
    }
  }

  const handleTimeClear = () => {
    setSelectedTime("")
    setTimeInput("")
    setShowTimeInput(false)
  }

  const handleTimeButtonClick = () => {
    // Eğer selectedTime varsa onu kullan, yoksa şu anki saati koy
    if (selectedTime) {
      setTimeInput(selectedTime)
    } else {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      setTimeInput(currentTime)
    }
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

  const getPositionStyle = () => {
    if (!position || isModal) return {}
    
    // Calculate viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Estimated editor dimensions (can be adjusted as needed)
    const editorWidth = 256 // min-w-64 = 16rem = 256px
    const editorHeight = 320 // Approximate height
    
    let { x, y } = position
    
    // Adjust horizontal position if it would go off-screen
    if (x + editorWidth > viewportWidth) {
      x = viewportWidth - editorWidth - 8 // 8px margin from edge
    }
    
    // Adjust vertical position if it would go off-screen
    if (y + editorHeight > viewportHeight) {
      y = position.y - editorHeight - 8 // Show above the clicked element
    }
    
    // Ensure minimum margins
    x = Math.max(8, x)
    y = Math.max(8, y)
    
    return {
      left: `${x}px`,
      top: `${y}px`
    }
  }

  const containerClass = isModal 
    ? "w-64 bg-background border rounded-lg shadow-lg p-3 min-w-64" 
    : "fixed bg-background border rounded-lg shadow-lg p-3 min-w-64 z-[100]"

  return (
    <div 
      ref={containerRef} 
      className={containerClass}
      style={getPositionStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-3">
        {/* Quick date options */}
        {!showCalendar && (
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation()
                handleDateSelect("Bugün")
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Bugün
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation()
                handleDateSelect("Yarın")
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Yarın
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={(e) => {
                e.stopPropagation()
                handleDateSelect("Sonraki hafta")
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Sonraki hafta
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={(e) => {
                e.stopPropagation()
                handleCustomDateClick()
              }}
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Tarih seçiniz</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Calendar */}
        {showCalendar && (
          <div className="space-y-3">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCalendar(false)
                }}
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreviousMonth()
                    }}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleNextMonth()
                    }}
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
                {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => i + 1).map((day) => {
                  const today = new Date()
                  const currentDate = new Date(currentYear, currentMonth, day)
                  const isPastDate = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  
                  // Parent task bitiş tarihi kontrolü
                  let isAfterParentDueDate = false
                  if (parentTaskDueDate) {
                    const parentEndOfDay = parentTaskDueDate.getHours() === 0 && parentTaskDueDate.getMinutes() === 0
                      ? new Date(parentTaskDueDate.getFullYear(), parentTaskDueDate.getMonth(), parentTaskDueDate.getDate(), 23, 59, 59)
                      : parentTaskDueDate
                    
                    isAfterParentDueDate = currentDate > parentEndOfDay
                  }
                  
                  const isDisabled = isPastDate || isAfterParentDueDate
                  
                  return (
                    <Button
                      key={day}
                      variant={selectedDate?.startsWith(`${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}`) ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 text-xs ${
                        isPastDate 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isAfterParentDueDate 
                          ? 'opacity-60 cursor-not-allowed bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20' 
                          : ''
                      }`}
                      disabled={isDisabled}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isDisabled) {
                          handleCalendarDateSelect(day)
                        }
                      }}
                    >
                      {day}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom date input */}
        {!showCalendar && (
          <div className="space-y-2">
            <Input
              placeholder="DD.MM.YYYY"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
            
            {/* Time picker toggle */}
            {!showTimeInput ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={(e) => {
                  e.stopPropagation()
                  handleTimeButtonClick()
                }}
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{selectedTime || "Zaman"}</span>
                </div>
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-background">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="text-sm">Zaman</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    value={timeInput}
                    onChange={(e) => setTimeInput(formatTimeInput(e.target.value))}
                    placeholder="__:__"
                    className="w-16 h-6 text-xs text-center"
                    maxLength={5}
                  />
                  <button
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTimeClear()
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Time confirmation buttons */}
            {showTimeInput && (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimeClear()
                  }}
                  className="flex-1"
                >
                  Temizle
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimeConfirm()
                  }}
                  className="flex-1"
                  disabled={isTimeConfirmLoading}
                >
                  {isTimeConfirmLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      <span>Kaydediliyor...</span>
                    </div>
                  ) : (
                    "Tamamlandı"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!showCalendar && (
          <div className="flex gap-2">
            <Button size="sm" onClick={(e) => {
              e.stopPropagation()
              handleSave()
            }} className="flex-1">
              Kaydet
            </Button>
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}>
              İptal
            </Button>
          </div>
        )}
      </div>
      
      <ValidationAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false, title: "", message: "" })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  )
}