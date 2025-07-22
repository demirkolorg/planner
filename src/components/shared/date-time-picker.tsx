"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, Clock, X, Star, ChevronRight, ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  initialDateTime?: string
  onSave: (dateTime: string | null) => void
  onCancel: () => void
  position?: { x: number; y: number }
  isModal?: boolean // Modal kullanımı için
}

export function DateTimePicker({ initialDateTime, onSave, onCancel, position, isModal = false }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [timeInput, setTimeInput] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [showTimeInput, setShowTimeInput] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(6) // 0-11 (Temmuz = 6)
  const [currentYear, setCurrentYear] = useState(2025)
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!isModal) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          handleSave()
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedDate, selectedTime, isModal])

  const handleSave = () => {
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
        alert('Geçmiş tarih seçilemez. Lütfen bugünden sonra bir tarih seçin.')
        return
      }

      // ISO string olarak gönder
      onSave(date.toISOString())
    } catch (error) {
      console.error('Invalid date format:', error)
      alert('Geçersiz tarih formatı. Lütfen DD.MM.YYYY formatında girin.')
    }
  }

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
    }
  }

  const handleTimeClear = () => {
    setSelectedTime("")
    setTimeInput("")
    setShowTimeInput(false)
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
                  
                  return (
                    <Button
                      key={day}
                      variant={selectedDate?.startsWith(`${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}`) ? "default" : "ghost"}
                      size="sm"
                      className={`h-8 w-8 text-xs ${isPastDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isPastDate}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isPastDate) {
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
                  <span>Zaman</span>
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
                >
                  Tamamlandı
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
    </div>
  )
}