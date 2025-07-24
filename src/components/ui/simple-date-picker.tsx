"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, ChevronRight, ChevronLeft, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SimpleDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SimpleDatePicker({
  date,
  onSelect,
  placeholder = "Tarih seçin",
  className,
  disabled = false,
}: SimpleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (date) {
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '.')
      setSelectedDate(dateStr)
    } else {
      setSelectedDate("")
    }
  }, [date])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleDateSelect = (dateOption: string) => {
    let targetDate: Date
    
    if (dateOption === "Bugün") {
      targetDate = new Date()
    } else if (dateOption === "Yarın") {
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 1)
    } else if (dateOption === "Sonraki hafta") {
      targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 7)
    } else {
      // Custom date string - parse DD.MM.YYYY format
      const [day, month, year] = dateOption.split('.')
      if (day && month && year) {
        targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        return
      }
    }

    const formattedDate = `${targetDate.getDate().toString().padStart(2, '0')}.${(targetDate.getMonth() + 1).toString().padStart(2, '0')}.${targetDate.getFullYear()}`
    setSelectedDate(formattedDate)
    onSelect?.(targetDate)
    setIsOpen(false)
    setShowCalendar(false)
  }

  const handleCalendarDateSelect = (day: number) => {
    const targetDate = new Date(currentYear, currentMonth, day)
    const formattedDate = `${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`
    setSelectedDate(formattedDate)
    onSelect?.(targetDate)
    setIsOpen(false)
    setShowCalendar(false)
  }

  const handleInputChange = (value: string) => {
    setSelectedDate(value)
    
    // Try to parse DD.MM.YYYY format
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
    const match = value.match(dateRegex)
    
    if (match) {
      const [, day, month, year] = match
      const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      // Check if date is valid
      if (!isNaN(parsedDate.getTime()) && 
          parsedDate.getDate() === parseInt(day) &&
          parsedDate.getMonth() === parseInt(month) - 1 &&
          parsedDate.getFullYear() === parseInt(year)) {
        onSelect?.(parsedDate)
        return
      }
    }
    
    // Clear selection if invalid or empty
    if (value === "") {
      onSelect?.(undefined)
    }
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

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const handleClear = () => {
    setSelectedDate("")
    onSelect?.(undefined)
    setIsOpen(false)
    setShowCalendar(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={selectedDate}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          disabled={disabled}
          className="pr-10"
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-72 bg-popover border border-border rounded-md shadow-lg p-3">
          {!showCalendar ? (
            <div className="space-y-2">
              {/* Quick options */}
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDateSelect("Bugün")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Bugün
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDateSelect("Yarın")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Yarın
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => handleDateSelect("Sonraki hafta")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Sonraki hafta
                </Button>
                <Button
                  variant="ghost"
                  size="sm" 
                  className="w-full justify-between"
                  onClick={() => setShowCalendar(true)}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Tarih seçiniz</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Temizle
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Tamam
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
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
                  {/* Empty cells for first week */}
                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }, (_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                  ))}
                  
                  {/* Calendar days */}
                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }, (_, i) => i + 1).map((day) => {
                    const isSelected = selectedDate?.startsWith(`${day.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}`)
                    
                    return (
                      <Button
                        key={day}
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 text-xs"
                        onClick={() => handleCalendarDateSelect(day)}
                      >
                        {day}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}