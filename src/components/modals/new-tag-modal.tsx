"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Smile } from "lucide-react"
import EmojiPicker from "emoji-picker-react"

const colorOptions = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", 
  "#8b5cf6", "#f59e0b", "#10b981", "#f472b6", "#ec4899", "#be123c",
  "#84cc16", "#06b6d4", "#6366f1", "#8b5cf6", "#d97706", "#059669",
  "#0ea5e9", "#7c3aed"
]

interface NewTagModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, color: string) => void
  editingTag?: { id: string; name: string; color: string } | null
}

export function NewTagModal({ isOpen, onClose, onSave, editingTag }: NewTagModalProps) {
  const [tagName, setTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(colorOptions[0])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Set initial values when editing
  useEffect(() => {
    if (editingTag) {
      setTagName(editingTag.name)
      setSelectedColor(editingTag.color)
    } else {
      setTagName("")
      setSelectedColor(colorOptions[0])
    }
  }, [editingTag])

  if (!isOpen) return null

  const handleSave = () => {
    if (tagName.trim()) {
      onSave(tagName.trim(), selectedColor)
      setTagName("")
      setSelectedColor(colorOptions[0])
      setShowEmojiPicker(false)
      onClose()
    }
  }

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setTagName(tagName + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    }
    if (e.key === "Escape") {
      setShowEmojiPicker(false)
      onClose()
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowEmojiPicker(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleModalClick}>
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {editingTag ? "Etiketi Düzenle" : "Yeni Etiket"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-name" className="text-sm text-muted-foreground">
              Etiketinize bir ad verin
            </Label>
            <div className="relative mt-2">
              <Input
                id="tag-name"
                placeholder="Planlama"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            {showEmojiPicker && (
              <div className="absolute z-50 mt-2">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={350}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">
              Renk seçin
            </Label>
            <div className="grid grid-cols-10 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 cursor-pointer ${
                    selectedColor === color
                      ? "border-white shadow-lg scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full mt-6"
            disabled={!tagName.trim()}
          >
            {editingTag ? "Etiketi Güncelle" : "Etiket Ekle"}
          </Button>
        </div>
      </div>
    </div>
  )
}