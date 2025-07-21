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
import { PRIORITIES } from "@/lib/constants/priority"

interface PrioritySelectorProps {
  currentPriority: string
  onUpdatePriority?: (priority: string) => void
  trigger?: React.ReactNode
}


export function PrioritySelector({ currentPriority, onUpdatePriority, trigger }: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePrioritySelect = (priority: string) => {
    onUpdatePriority?.(priority)
    setIsOpen(false)
  }

  const currentPriorityData = PRIORITIES.find(p => p.name === currentPriority) || PRIORITIES[4]

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" style={{ color: currentPriorityData.color }}>
            <Flag className="h-4 w-4 mr-2" />
            {currentPriorityData.name}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <div className="p-1">
          {PRIORITIES.map((priority) => (
            <DropdownMenuItem
              key={priority.name}
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handlePrioritySelect(priority.name)}
            >
              <div className="flex items-center">
                <Flag 
                  className="h-4 w-4 mr-2"
                  style={{ color: priority.color }}
                />
                <span>{priority.name}</span>
              </div>
              {currentPriority === priority.name && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}