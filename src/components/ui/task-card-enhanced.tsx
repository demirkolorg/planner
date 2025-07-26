/**
 * Enhanced TaskCard Component
 * Modern design token kullanımı ile standardize edilmiş
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { PRIORITY_COLORS, SEMANTIC_SPACING } from '@/lib/design-tokens'

// TaskCard variant definitions using design tokens
const taskCardVariants = cva(
  "group relative p-4 border rounded-lg transition-all duration-200",
  {
    variants: {
      // Priority variants with left border
      priority: {
        critical: "border-l-4 border-l-red-500 hover:border-l-red-600",
        high: "border-l-4 border-l-orange-500 hover:border-l-orange-600", 
        medium: "border-l-4 border-l-blue-500 hover:border-l-blue-600",
        low: "border-l-4 border-l-purple-500 hover:border-l-purple-600",
        none: "border-l-4 border-l-gray-400 hover:border-l-gray-500",
      },
      
      // Status variants
      status: {
        default: "border-border hover:border-border/80",
        completed: "opacity-60 bg-muted/30",
        overdue: "bg-gradient-to-r from-transparent to-red-50 dark:to-red-950/20",
        due_today: "bg-gradient-to-r from-transparent to-orange-50 dark:to-orange-950/20",
        due_tomorrow: "bg-gradient-to-r from-transparent to-yellow-50 dark:to-yellow-950/20",
      },
      
      // Nesting level for indentation
      level: {
        0: "",
        1: "ml-6", // 24px
        2: "ml-12", // 48px  
        3: "ml-18", // 72px
        4: "ml-24", // 96px
      },
      
      // Size variants
      size: {
        compact: "p-3 text-sm",
        default: "p-4",
        comfortable: "p-6",
      },
      
      // Interactive states
      interactive: {
        true: "cursor-pointer hover:shadow-sm hover:bg-accent/50",
        false: "",
      }
    },
    defaultVariants: {
      priority: "none",
      status: "default", 
      level: 0,
      size: "default",
      interactive: true,
    },
  }
)

// Priority color mapping to design tokens
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'critical':
    case 'kritik':
      return PRIORITY_COLORS.CRITICAL
    case 'high':  
    case 'yüksek':
      return PRIORITY_COLORS.HIGH
    case 'medium':
    case 'orta':
      return PRIORITY_COLORS.MEDIUM
    case 'low':
    case 'düşük':
      return PRIORITY_COLORS.LOW
    default:
      return PRIORITY_COLORS.NONE
  }
}

// Status type mapping
const getStatusVariant = (isOverdue: boolean, isDueToday: boolean, isDueTomorrow: boolean) => {
  if (isOverdue) return 'overdue'
  if (isDueToday) return 'due_today'  
  if (isDueTomorrow) return 'due_tomorrow'
  return 'default'
}

interface TaskCardProps extends VariantProps<typeof taskCardVariants> {
  children: React.ReactNode
  task?: {
    priority: string
    completed: boolean
    level?: number
    isOverdue?: boolean
    isDueToday?: boolean
    isDueTomorrow?: boolean
  }
  className?: string
  onClick?: () => void
}

export function TaskCardEnhanced({ 
  children, 
  task,
  priority,
  status,
  level,
  size,
  interactive,
  className,
  onClick,
  ...props 
}: TaskCardProps) {
  
  // Auto-detect variants from task data if provided
  const finalPriority = task?.priority ? 
    task.priority.toLowerCase() as VariantProps<typeof taskCardVariants>['priority'] :
    priority

  const finalStatus = task ? 
    (task.completed ? 'completed' : 
     getStatusVariant(!!task.isOverdue, !!task.isDueToday, !!task.isDueTomorrow)) :
    status
    
  const finalLevel = task?.level ?? level
  
  return (
    <div
      className={cn(
        taskCardVariants({
          priority: finalPriority,
          status: finalStatus, 
          level: finalLevel,
          size,
          interactive
        }),
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// Task content helpers with semantic spacing
export const TaskContent = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
)

export const TaskHeader = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className={cn("flex items-center justify-between", className)} {...props}>
    {children}
  </div>
)

export const TaskFooter = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div 
    className={cn("flex items-center justify-between mt-4 pt-3 border-t border-border/50", className)} 
    {...props}
  >
    {children}
  </div>
)

export const TaskDescription = ({ children, className, ...props }: React.HTMLProps<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground whitespace-pre-wrap pt-3 mb-4", className)} {...props}>
    {children}
  </p>
)

export const TaskTags = ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => (
  <div className={cn("flex flex-wrap gap-1 mb-3", className)} {...props}>
    {children}
  </div>
)

export type { VariantProps }
export { taskCardVariants }