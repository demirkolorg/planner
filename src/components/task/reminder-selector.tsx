"use client"

import { useState } from "react"
import { Bell, Plus, X, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Reminder {
  id: string
  taskId: string
  datetime: Date
  message?: string
  isActive: boolean
}

interface ReminderSelectorProps {
  taskReminders?: Reminder[]
  onUpdateReminders?: (reminders: Partial<Reminder>[]) => void
  trigger?: React.ReactNode
}

export function ReminderSelector({ taskReminders = [], onUpdateReminders, trigger }: ReminderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreatingReminder, setIsCreatingReminder] = useState(false)
  const [newReminderDate, setNewReminderDate] = useState("")
  const [newReminderTime, setNewReminderTime] = useState("")
  const [newReminderMessage, setNewReminderMessage] = useState("")

  // Hızlı seçenekler
  const QUICK_OPTIONS = [
    {
      label: "15 dakika sonra",
      getValue: () => {
        const date = new Date()
        date.setMinutes(date.getMinutes() + 15)
        return date
      }
    },
    {
      label: "1 saat sonra",
      getValue: () => {
        const date = new Date()
        date.setHours(date.getHours() + 1)
        return date
      }
    },
    {
      label: "Yarın sabah 9:00",
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        date.setHours(9, 0, 0, 0)
        return date
      }
    },
    {
      label: "Yarın öğlen 13:00",
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        date.setHours(13, 0, 0, 0)
        return date
      }
    },
    {
      label: "Gelecek hafta",
      getValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        date.setHours(9, 0, 0, 0)
        return date
      }
    }
  ]

  // Bugünün tarihini al (min date için)
  const today = new Date().toISOString().split('T')[0]

  // Hatırlatıcı ekle
  const addReminder = (datetime: Date, message?: string) => {
    const newReminder: Partial<Reminder> = {
      datetime,
      message: message || undefined,
      isActive: true
    }
    
    const updatedReminders = [...taskReminders, newReminder as Reminder]
    onUpdateReminders?.(updatedReminders)
  }

  // Hatırlatıcı sil
  const removeReminder = (index: number) => {
    const updatedReminders = taskReminders.filter((_, i) => i !== index)
    onUpdateReminders?.(updatedReminders)
  }

  // Hızlı seçenek ile hatırlatıcı ekle
  const handleQuickOption = (getValue: () => Date, label: string) => {
    const datetime = getValue()
    addReminder(datetime, label)
    setIsOpen(false)
  }

  // Özel hatırlatıcı oluştur
  const createCustomReminder = () => {
    if (!newReminderDate || !newReminderTime) return

    const datetime = new Date(`${newReminderDate}T${newReminderTime}`)
    addReminder(datetime, newReminderMessage || undefined)
    
    // Form'u sıfırla
    setNewReminderDate("")
    setNewReminderTime("")
    setNewReminderMessage("")
    setIsCreatingReminder(false)
  }

  // Tarih formatı
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(date))
  }

  // Aktif hatırlatıcı sayısı
  const activeRemindersCount = taskReminders.filter(r => r.isActive).length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Hatırlatıcı
            {activeRemindersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {activeRemindersCount}
              </Badge>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-0" align="end">
        <div className="p-3">
          {/* Mevcut Hatırlatıcılar */}
          {taskReminders.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2">Mevcut Hatırlatıcılar</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {taskReminders.map((reminder, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {formatDateTime(reminder.datetime)}
                      </div>
                      {reminder.message && (
                        <div className="text-xs text-muted-foreground truncate">
                          {reminder.message}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeReminder(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hızlı Seçenekler */}
          {!isCreatingReminder && (
            <>
              <div className="text-xs text-muted-foreground mb-2">Hızlı Seçenekler</div>
              <div className="space-y-1 mb-3">
                {QUICK_OPTIONS.map((option, index) => (
                  <DropdownMenuItem
                    key={index}
                    className="cursor-pointer"
                    onClick={() => handleQuickOption(option.getValue, option.label)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </div>

              <DropdownMenuSeparator className="my-3" />

              {/* Özel Hatırlatıcı Oluştur */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsCreatingReminder(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Özel Hatırlatıcı
              </Button>
            </>
          )}

          {/* Özel Hatırlatıcı Formu */}
          {isCreatingReminder && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Özel Hatırlatıcı</div>
              
              {/* Tarih Seçimi */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  min={today}
                  className="flex-1"
                />
              </div>

              {/* Saat Seçimi */}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Mesaj (Opsiyonel) */}
              <Input
                placeholder="Hatırlatıcı mesajı (opsiyonel)"
                value={newReminderMessage}
                onChange={(e) => setNewReminderMessage(e.target.value)}
              />

              {/* Butonlar */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={createCustomReminder}
                  disabled={!newReminderDate || !newReminderTime}
                >
                  Ekle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingReminder(false)
                    setNewReminderDate("")
                    setNewReminderTime("")
                    setNewReminderMessage("")
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}