/**
 * Priority Flag Component
 * Standardized priority visualization using design tokens
 */

import React from 'react'
import { Flag } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { PRIORITY_COLORS } from '@/lib/design-tokens'

const priorityFlagVariants = cva(
  "inline-flex items-center gap-1",
  {
    variants: {
      priority: {
        critical: "text-red-600",
        high: "text-orange-500",
        medium: "text-blue-500", 
        low: "text-purple-500",
        none: "text-gray-400",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      variant: {
        icon: "",
        label: "",
        both: "",
      }
    },
    defaultVariants: {
      priority: "none",
      size: "sm",
      variant: "icon",
    },
  }
)

const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4", 
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

// Priority mapping for Turkish labels
const priorityLabels = {
  critical: "Kritik",
  high: "Yüksek",
  medium: "Orta", 
  low: "Düşük",
  none: "Yok",
}

// Normalize priority values
const normalizePriority = (priority: string): keyof typeof priorityLabels => {
  const normalized = priority.toLowerCase()
  switch (normalized) {
    case 'critical':
    case 'kritik':
      return 'critical'
    case 'high':
    case 'yüksek':
      return 'high'
    case 'medium': 
    case 'orta':
      return 'medium'
    case 'low':
    case 'düşük':
      return 'low'
    default:
      return 'none'
  }
}

interface PriorityFlagProps extends VariantProps<typeof priorityFlagVariants> {
  priority: string
  className?: string
  showLabel?: boolean
}

export function PriorityFlag({ 
  priority: rawPriority, 
  size = "sm",
  variant = "icon",
  className,
  showLabel = false,
  ...props 
}: PriorityFlagProps) {
  const priority = normalizePriority(rawPriority)
  const label = priorityLabels[priority]
  
  const shouldShowLabel = showLabel || variant === "label" || variant === "both"
  const shouldShowIcon = variant === "icon" || variant === "both"
  
  return (
    <span
      className={cn(
        priorityFlagVariants({ priority, size, variant }),
        className
      )}
      title={`Öncelik: ${label}`}
      {...props}
    >
      {shouldShowIcon && (
        <Flag 
          className={cn(iconSizes[size!], "flex-shrink-0")}
          style={{ color: PRIORITY_COLORS[priority.toUpperCase() as keyof typeof PRIORITY_COLORS] }}
        />
      )}
      {shouldShowLabel && (
        <span className="font-medium">
          {label}
        </span>
      )}
    </span>
  )
}

// Helper hook for priority colors
export const usePriorityColor = (priority: string) => {
  const normalized = normalizePriority(priority)
  return PRIORITY_COLORS[normalized.toUpperCase() as keyof typeof PRIORITY_COLORS]
}

export type { PriorityFlagProps }