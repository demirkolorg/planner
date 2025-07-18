"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Calendar, Clock, Copy, Star, ChevronRight, Plus } from "lucide-react"
import { BRAND_COLOR } from "@/lib/constants"

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (title: string, description: string, projectId: string) => void
}

export function NewTaskModal({ isOpen, onClose, onSave }: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedProject, setSelectedProject] = useState("Proje 1")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setDescription("")
      setSelectedProject("Proje 1")
      setShowDatePicker(false)
      setSelectedDate(null)
    }
  }, [isOpen])

  const handleDateSelect = (dateOption: string) => {
    setSelectedDate(dateOption)
    setShowDatePicker(false)
  }

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), description.trim(), "temp-project-id")
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border p-0 top-[20%] translate-y-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <h2 className="text-lg font-semibold">Görev Ekle</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title Input */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Yapılacak adı"
              className="text-lg font-medium border-0 bg-transparent focus-visible:ring-0 px-0"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama ekle..."
              className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 py-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDate || "Zamanla"}
              </Button>
              
              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 p-3">
                  <div className="space-y-2">
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Bugün")}
                    >
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Bugün</span>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Yarın")}
                    >
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Yarın</span>
                    </div>
                    <div 
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => handleDateSelect("Sonraki hafta")}
                    >
                      <Calendar className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Sonraki hafta</span>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Tarih seçiniz</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Yinele</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    <div className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Zaman</span>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Clock className="h-4 w-4 mr-2" />
              Süre
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4 mr-2" />
              Kopyala
            </Button>
          </div>

          {/* Project Selection and Save Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-white font-medium">{selectedProject}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-400">Bölüm Yok</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="text-white px-6"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Yapılacak Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}