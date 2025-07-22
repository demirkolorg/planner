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