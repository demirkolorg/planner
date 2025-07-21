"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Flag } from "lucide-react"
import { PRIORITIES } from "@/lib/constants/priority"

interface PriorityPickerProps {
  selectedPriority: string
  onPrioritySelect: (priority: string) => void
  className?: string
}

export const PriorityPicker = ({ selectedPriority, onPrioritySelect, className }: PriorityPickerProps) => {
  const [showPicker, setShowPicker] = useState(false)

  const getPriorityColor = () => {
    const priority = PRIORITIES.find(p => p.name === selectedPriority)
    return priority?.color || PRIORITIES[4].color // Varsayılan olarak "Yok" rengini kullan
  }

  const handlePrioritySelect = (priority: string) => {
    onPrioritySelect(priority)
    setShowPicker(false)
  }

  return (
    <div className={`relative ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPicker(!showPicker)}
            style={{ color: getPriorityColor() }}
          >
            <Flag className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Öncelik</p>
        </TooltipContent>
      </Tooltip>

      {/* Priority Picker Dropdown */}
      {showPicker && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-background border rounded-lg shadow-lg z-50 p-1">
          <div>
            {PRIORITIES.map((priority) => (
              <div
                key={priority.name}
                className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => handlePrioritySelect(priority.name)}
              >
                <Flag
                  className="h-4 w-4"
                  style={{ color: priority.color }}
                />
                <span className="text-xs">{priority.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}