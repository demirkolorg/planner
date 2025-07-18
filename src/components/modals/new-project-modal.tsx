"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

// Emoji seçenekleri
const emojis = [
  "⏰", "🔥", "🎯", "⚡", "🚀", "💎", "🌟", "⭐", "🔮", "🎨", "🎭", "🎪", "🎸", "🎹", "🎺", "🎻",
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
  "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
  "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥"
]

// Renk seçenekleri
const colors = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#a78bfa", "#fb7185",
  "#06b6d4", "#ec4899", "#84cc16", "#d946ef", "#6b7280", "#dc2626", "#059669", "#7c3aed",
  "#0ea5e9", "#fbbf24", "#34d399", "#a855f7", "#f472b6", "#64748b", "#10b981", "#8b5cf6"
]

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, emoji: string, color: string) => void
  editingProject?: { id: string, name: string, emoji: string, color: string } | null
}

export function NewProjectModal({ isOpen, onClose, onSave, editingProject }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("⏰")
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [useEmoji, setUseEmoji] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState("")

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name)
      setSelectedEmoji(editingProject.emoji)
      setSelectedColor(editingProject.color)
      setUseEmoji(!!editingProject.emoji)
    } else {
      setName("")
      setSelectedEmoji("⏰")
      setSelectedColor(colors[0])
      setUseEmoji(false)
    }
    setShowEmojiPicker(false)
    setEmojiSearch("")
  }, [editingProject, isOpen])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), useEmoji ? selectedEmoji : "", selectedColor)
      onClose()
    }
  }

  const filteredEmojis = emojis.filter(emoji => 
    emojiSearch === "" || emoji.includes(emojiSearch)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {editingProject ? "Proje Düzenle" : "Yeni Proje"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Proje İkonu */}
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: selectedColor + "20" }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                {useEmoji ? selectedEmoji : (
                  <svg className="w-8 h-8" style={{ color: selectedColor }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Proje Adı */}
          <div className="space-y-2">
            <Label className="text-gray-300">Proje adı</Label>
            <div className="relative">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Proje adı"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Emoji Kullan Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
              <Label className="text-gray-300">Emoji kullan</Label>
            </div>
            <Switch
              checked={useEmoji}
              onCheckedChange={setUseEmoji}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>

          {/* Emoji Picker */}
          {useEmoji && showEmojiPicker && (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Emoji ara..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pl-10"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              
              <div className="text-sm text-gray-400 font-medium">Gülen Yüzler ve İnsanlar</div>
              
              <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedEmoji(emoji)
                      setShowEmojiPicker(false)
                    }}
                    className={`p-2 rounded-lg text-2xl hover:bg-gray-800 transition-colors ${
                      selectedEmoji === emoji ? "bg-purple-600" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Renk Seçici */}
          {!useEmoji && (
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-3">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                      selectedColor === color ? "border-white" : "border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Kaydet Butonu */}
          <Button
            onClick={handleSave}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!name.trim()}
          >
            {editingProject ? "Proje Güncelle" : "Proje Ekle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}