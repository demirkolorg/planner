// Date utilities for safe date string conversion

export function toSafeDateString(date: Date | string | undefined): string | undefined {
  if (!date) return undefined
  if (typeof date === 'string') return date
  if (date instanceof Date) return date.toISOString()
  return undefined
}

export function toSafeDate(dateStr: string | Date | undefined): Date | undefined {
  if (!dateStr) return undefined
  if (dateStr instanceof Date) return dateStr
  if (typeof dateStr === 'string') return new Date(dateStr)
  return undefined
}

// Overdue detection utilities

export interface TaskDateStatus {
  isOverdue: boolean
  daysOverdue: number
  isDueToday: boolean
  isDueTomorrow: boolean
  daysUntilDue: number
  status: 'overdue' | 'due-today' | 'due-tomorrow' | 'due-soon' | 'future' | 'no-date'
}

export function getTaskDateStatus(dueDate: string | Date | undefined): TaskDateStatus {
  if (!dueDate) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      isDueToday: false,
      isDueTomorrow: false,
      daysUntilDue: 0,
      status: 'no-date'
    }
  }

  const due = toSafeDate(dueDate)
  if (!due) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      isDueToday: false,
      isDueTomorrow: false,
      daysUntilDue: 0,
      status: 'no-date'
    }
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  
  const diffTime = dueStart.getTime() - todayStart.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const isOverdue = diffDays < 0
  const isDueToday = diffDays === 0
  const isDueTomorrow = diffDays === 1

  let status: TaskDateStatus['status']
  if (isOverdue) {
    status = 'overdue'
  } else if (isDueToday) {
    status = 'due-today'
  } else if (isDueTomorrow) {
    status = 'due-tomorrow'
  } else if (diffDays <= 7) {
    status = 'due-soon'
  } else {
    status = 'future'
  }

  return {
    isOverdue,
    daysOverdue: isOverdue ? Math.abs(diffDays) : 0,
    isDueToday,
    isDueTomorrow,
    daysUntilDue: Math.max(0, diffDays),
    status
  }
}

export function getOverdueMessage(daysOverdue: number): string {
  if (daysOverdue === 0) return ''
  if (daysOverdue === 1) return '1 gün gecikme'
  return `${daysOverdue} gün gecikme`
}

export function getDueDateMessage(status: TaskDateStatus): string {
  switch (status.status) {
    case 'overdue':
      return getOverdueMessage(status.daysOverdue)
    case 'due-today':
      return 'Bugün bitiyor'
    case 'due-tomorrow':
      return 'Yarın bitiyor'
    case 'due-soon':
      if (status.daysUntilDue === 1) return 'Yarın'
      return `${status.daysUntilDue} gün kaldı`
    default:
      return ''
  }
}

export function getDateStatusColor(status: TaskDateStatus['status']): string {
  switch (status) {
    case 'overdue':
      return '#ef4444' // red
    case 'due-today':
      return '#f97316' // orange
    case 'due-tomorrow':
      return '#eab308' // yellow
    case 'due-soon':
      return '#3b82f6' // blue
    default:
      return '#6b7280' // gray
  }
}