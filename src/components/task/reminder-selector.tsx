"use client"

import { ReminderPicker } from "@/components/ui/reminder-picker"

interface TaskReminder {
  id: string
  taskId: string
  datetime: Date
  message?: string
  isActive: boolean
}

interface ReminderSelectorProps {
  taskReminders?: TaskReminder[]
  onUpdateReminders?: (reminders: Array<{
    datetime: Date
    message?: string
    isActive?: boolean
  }>) => void
  trigger?: React.ReactNode
  dropdownPosition?: 'top' | 'bottom'
  taskDueDate?: Date | null
}

export function ReminderSelector({ 
  taskReminders = [], 
  onUpdateReminders, 
  trigger, 
  dropdownPosition = 'top',
  taskDueDate
}: ReminderSelectorProps) {
  // Mevcut görevin reminder'larını string formatına çevir
  const selectedReminderStrings = taskReminders.map(reminder => {
    const date = new Date(reminder.datetime)
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })

  // ReminderPicker string array bekliyor, biz de string array veriyoruz
  const handleRemindersChange = async (newReminderStrings: string[]) => {
    try {
      // String formatındaki hatırlatıcıları Date objesine çevir
      const formattedReminders = newReminderStrings.map(reminderString => {
        // "19 Temmuz 2025 14:30" formatından Date'e çevir
        const parts = reminderString.split(' ')
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
          const dateTime = new Date(`${dateStr}T${time}:00`)
          
          return {
            datetime: dateTime,
            message: '',
            isActive: true
          }
        }
        return {
          datetime: new Date(),
          message: '',
          isActive: true
        }
      })
      
      onUpdateReminders?.(formattedReminders)
    } catch (error) {
      console.error('Failed to update reminders:', error)
    }
  }

  return (
    <ReminderPicker
      selectedReminders={selectedReminderStrings}
      onRemindersChange={handleRemindersChange}
      trigger={trigger}
      dropdownPosition={dropdownPosition}
      parentTaskDueDate={taskDueDate}
    />
  )
}