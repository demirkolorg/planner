/**
 * Status Badge Component  
 * Standardized status visualization using design tokens
 */

import React from 'react'
import { AlertTriangle, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { STATUS_COLORS } from '@/lib/design-tokens'

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
  {
    variants: {
      status: {
        overdue: "bg-destructive/10 text-destructive",
        due_today: "bg-primary/10 text-primary",
        due_tomorrow: "bg-secondary/20 text-secondary-foreground", 
        upcoming: "bg-primary/10 text-primary",
        completed: "bg-accent/10 text-accent",
        no_date: "bg-gray-50 text-gray-700 dark:bg-gray-950/20 dark:text-gray-400",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs", 
        lg: "px-3 py-1.5 text-sm",
      },
      variant: {
        solid: "",
        outline: "bg-transparent border",
        ghost: "bg-transparent",
      }
    },
    defaultVariants: {
      status: "no_date",
      size: "md", 
      variant: "solid",
    },
  }
)

// Status icon mapping
const statusIcons = {
  overdue: AlertTriangle,
  due_today: AlertTriangle,
  due_tomorrow: Calendar,
  upcoming: Calendar,
  completed: CheckCircle2,
  no_date: Clock,
}

// Status labels
const statusLabels = {
  overdue: "Süresi geçti",
  due_today: "Bugün",
  due_tomorrow: "Yarın", 
  upcoming: "Yaklaşan",
  completed: "Tamamlandı",
  no_date: "Tarih yok",
}

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: keyof typeof statusLabels
  label?: string
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ 
  status,
  label,
  size = "md",
  variant = "solid", 
  showIcon = true,
  className,
  ...props 
}: StatusBadgeProps) {
  const Icon = statusIcons[status]
  const displayLabel = label || statusLabels[status]
  
  return (
    <span
      className={cn(
        statusBadgeVariants({ status, size, variant }),
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon className="h-3 w-3 flex-shrink-0" />
      )}
      <span>{displayLabel}</span>
    </span>
  )
}

// Helper to determine status from date
export const getDateStatus = (dueDate?: string, completed?: boolean) => {
  if (completed) return 'completed'
  if (!dueDate) return 'no_date'
  
  const due = new Date(dueDate)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  // Reset time to compare dates only
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrowDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
  
  if (dueDay < todayDay) return 'overdue'
  if (dueDay.getTime() === todayDay.getTime()) return 'due_today'
  if (dueDay.getTime() === tomorrowDay.getTime()) return 'due_tomorrow'
  return 'upcoming'
}

export type { StatusBadgeProps }