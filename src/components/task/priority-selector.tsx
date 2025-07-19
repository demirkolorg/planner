"use client"

import { useState } from "react"
import { Check, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface PrioritySelectorProps {
  currentPriority: string
  onUpdatePriority?: (priority: string) => void
  trigger?: React.ReactNode
}

const PRIORITIES = [
  {
    value: "HIGH",
    label: "Yüksek",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/10",
    icon: "🔴"
  },
  {
    value: "MEDIUM", 
    label: "Orta",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/10",
    icon: "🟡"
  },
  {
    value: "LOW",
    label: "Düşük", 
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
    icon: "🔵"
  },
  {
    value: "NONE",
    label: "Önceliksiz",
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-900/10",
    icon: "⚪"
  }
]

export function PrioritySelector({ currentPriority, onUpdatePriority, trigger }: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePrioritySelect = (priority: string) => {
    onUpdatePriority?.(priority)
    setIsOpen(false)
  }

  const currentPriorityData = PRIORITIES.find(p => p.value === currentPriority) || PRIORITIES[3]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn(currentPriorityData.color)}>
            <Flag className="h-4 w-4 mr-2" />
            {currentPriorityData.label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <div className="p-1">
          {PRIORITIES.map((priority) => (
            <DropdownMenuItem
              key={priority.value}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handlePrioritySelect(priority.value)}
            >
              <div className="flex items-center">
                <span className="mr-2">{priority.icon}</span>
                <span className={priority.color}>{priority.label}</span>
              </div>
              {currentPriority === priority.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}