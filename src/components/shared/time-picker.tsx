"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ValidationAlert } from "@/components/ui/validation-alert"

interface TimePickerProps {
  initialTime?: string // "HH:MM" format
  onSave: (time: string | null) => void
  onCancel: () => void
  position?: { x: number; y: number }
  isModal?: boolean
}

export function TimePicker({ initialTime, onSave, onCancel, position, isModal = false }: TimePickerProps) {
  const [timeInput, setTimeInput] = useState("")
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: "",
    message: ""
  })

  useEffect(() => {
    if (initialTime) {
      setTimeInput(initialTime)
    } else {
      // Şu anki saati default olarak koy
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      setTimeInput(currentTime)
    }
  }, [initialTime])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isModal) {
          handleSave()
        } else {
          onCancel()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isModal, onCancel])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleSave = async () => {
    if (timeInput.trim()) {
      // Time input validation
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(timeInput.trim())) {
        setAlertConfig({
          isOpen: true,
          title: "Geçersiz Saat",
          message: "Lütfen geçerli bir saat formatı girin (ÖR: 14:30)"
        })
        return
      }
      
      // Visual feedback
      setIsConfirmLoading(true)
      
      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300))
      
      onSave(timeInput.trim())
      setIsConfirmLoading(false)
    } else {
      onSave(null)
    }
  }

  const handleClear = () => {
    setTimeInput("")
    onSave(null)
  }

  const formatTimeInput = (value: string) => {
    // Sadece sayıları al
    const numbers = value.replace(/\D/g, '')
    
    // Maksimum 4 karakter
    const truncated = numbers.slice(0, 4)
    
    // Maskeleme uygula
    if (truncated.length >= 3) {
      return `${truncated.slice(0, 2)}:${truncated.slice(2)}`
    } else if (truncated.length >= 1) {
      return truncated
    }
    return ''
  }

  const getPositionStyle = () => {
    if (!position || isModal) return {}
    
    // Calculate viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Estimated picker dimensions
    const pickerWidth = 300
    const pickerHeight = 200
    
    let { x, y } = position
    
    // Adjust horizontal position if it would go off-screen
    if (x + pickerWidth > viewportWidth) {
      x = viewportWidth - pickerWidth - 8
    }
    
    // Adjust vertical position if it would go off-screen
    if (y + pickerHeight > viewportHeight) {
      y = position.y - pickerHeight - 8
    }
    
    // Ensure minimum margins
    x = Math.max(8, x)
    y = Math.max(8, y)
    
    return {
      left: `${x}px`,
      top: `${y}px`
    }
  }

  const containerClass = isModal 
    ? "w-[300px] bg-background border rounded-lg shadow-lg p-4" 
    : "fixed bg-background border rounded-lg shadow-lg p-4 w-[300px] z-[100]"

  return (
    <div 
      ref={containerRef} 
      className={containerClass}
      style={getPositionStyle()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Saat Seç</span>
          </div>
          {!isModal && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quick time options */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setTimeInput("09:00")}
          >
            09:00
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setTimeInput("12:00")}
          >
            12:00
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setTimeInput("14:00")}
          >
            14:00
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => setTimeInput("18:00")}
          >
            18:00
          </Button>
        </div>

        {/* Time input */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              value={timeInput}
              onChange={(e) => setTimeInput(formatTimeInput(e.target.value))}
              placeholder="__:__"
              className="text-center text-lg font-mono"
              maxLength={5}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="flex-1"
          >
            İptal
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1"
            disabled={isConfirmLoading}
          >
            {isConfirmLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                <span>Kaydediliyor...</span>
              </div>
            ) : (
              "Kaydet"
            )}
          </Button>
        </div>
      </div>
      
      <ValidationAlert
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false, title: "", message: "" })}
        title={alertConfig.title}
        message={alertConfig.message}
      />
    </div>
  )
}