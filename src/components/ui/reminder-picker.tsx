"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Plus, ChevronLeft, ChevronRight, Clock, Bell } from "lucide-react"

interface ReminderPickerProps {
  selectedReminders: string[]
  onRemindersChange: (reminders: string[]) => void
  trigger?: React.ReactNode
  dropdownPosition?: 'top' | 'bottom'
}

export function ReminderPicker({
  selectedReminders,
  onRemindersChange,
  trigger,
  dropdownPosition = 'bottom'
}: ReminderPickerProps) {
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [showReminderCalendar, setShowReminderCalendar] = useState(false)
  const [reminderDate, setReminderDate] = useState<string | null>(null)
  const [reminderTime, setReminderTime] = useState<string>("")
  const [reminderMonth, setReminderMonth] = useState(6) // Temmuz
  const [reminderYear, setReminderYear] = useState(2025)

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

  const handleAddReminder = () => {
    setShowReminderCalendar(true)
    // Şu anki saati default olarak koy
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setReminderTime(currentTime)
  }

  const handleRemoveReminder = (index: number) => {
    const newReminders = selectedReminders.filter((_, i) => i !== index)
    onRemindersChange(newReminders)
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
      const newReminders = [...selectedReminders, reminderText]
      onRemindersChange(newReminders)
      setShowReminderCalendar(false)
      setReminderDate(null)
      setReminderTime("")
    }
  }

  const getMonthName = (monthIndex: number) => {
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ]
    return monthNames[monthIndex]
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const DefaultTrigger = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setShowReminderPicker(!showReminderPicker)}
      className="relative h-7 w-7"
    >
      <Bell className="h-3 w-3" />
      {selectedReminders.length > 0 && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </Button>
  )

  return (
    <TooltipProvider>
      <div className="relative">
        {trigger ? (
          <div onClick={() => setShowReminderPicker(!showReminderPicker)}>
            {trigger}
          </div>
        ) : (
          <DefaultTrigger />
        )}

        {/* Reminder Picker Dropdown */}
        {showReminderPicker && !showReminderCalendar && (
          <div className={`absolute right-0 w-64 bg-background border rounded-lg shadow-lg z-50 p-3 ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
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

            {selectedReminders.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Hatırlatıcılar listeniz burada görünecek. '+' düğmesine tıklayarak bir tane ekleyin
                </p>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                {selectedReminders.map((reminder, index) => (
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
          <div className={`absolute right-0 w-80 bg-background border rounded-lg shadow-lg z-50 p-4 ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
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
    </TooltipProvider>
  )
}