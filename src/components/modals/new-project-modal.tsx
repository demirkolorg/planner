"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

// Emoji kategorileri
const emojiCategories = {
  "Favoriler": [
    "🚀", "💎", "🎯", "⚡", "🔥", "⭐", "💡", "🎨", "📱", "💻", "⌚", "🏆", "🎵", "📚", "✈️", "🚗",
    "🏠", "💰", "🎮", "📈", "🔧", "🎪", "🌟", "🎭", "🏋", "🎸", "📊", "🔮", "🎲", "🎺", "🎻", "🏹", "📥",
    "✅", "📝", "📋", "🗂️", "📂", "🎪", "🛠️", "⚙️", "🔖", "📌"
  ],
  "Seyahat": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍", "🛵",
    "🚲", "🛴", "🛹", "✈️", "🛩", "🛫", "🛬", "🚀", "🛸", "🚁", "⛵", "🚤", "🛥", "🛳", "⛴", "🚢",
    "⚓", "🚇", "🚈", "🚝", "🚞", "🚋", "🚃", "🚂", "🚄", "🚅", "🚆", "🏰", "🏯", "🏟", "🎡", "🎢"
  ],
  "Aktivite": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
    "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸", "🥌",
    "🎿", "⛷", "🏂", "🪂", "🏋", "🤼", "🤸", "⛹", "🤺", "🏌", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗"
  ],
  "Nesne": [
    "⌚", "📱", "📲", "💻", "⌨", "🖥", "🖨", "🖱", "🖲", "🕹", "🗜", "💽", "💾", "💿", "📀", "📼",
    "📷", "📸", "📹", "🎥", "📽", "🎞", "📞", "☎", "📟", "📠", "📺", "📻", "🎙", "🎚", "🎛", "🧭",
    "⏱", "⏲", "⏰", "🕰", "📡", "🔋", "🔌", "💡", "🔦", "🕯", "🪔", "🧯", "🛢", "💸", "💵", "💴"
  ],
  "Sembol": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
    "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
    "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴"
  ]
}

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, emoji: string) => void
  editingProject?: { id: string, name: string, emoji: string } | null
}

export function NewProjectModal({ isOpen, onClose, onSave, editingProject }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🚀")
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof emojiCategories>("Favoriler")

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name)
      setSelectedEmoji(editingProject.emoji || "🚀")
    } else {
      setName("")
      setSelectedEmoji("🚀")
    }
    setSelectedCategory("Favoriler")
  }, [editingProject, isOpen])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), selectedEmoji)
      onClose()
    }
  }

  const getCurrentEmojis = () => {
    return emojiCategories[selectedCategory]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingProject ? "Proje Düzenle" : "Yeni Proje"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Proje İkonu */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-3xl">
              {selectedEmoji}
            </div>
          </div>

          {/* Proje Adı */}
          <div className="space-y-2">
            <Label>Proje adı</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Proje adı"
            />
          </div>

          {/* Emoji Kategorileri */}
          <div className="space-y-4">
            <Label>Emoji Kategorisi</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(emojiCategories).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category as keyof typeof emojiCategories)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Emoji Seçimi */}
          <div className="space-y-4">
            <Label>{selectedCategory}</Label>
            <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
              {getCurrentEmojis().map((emoji, index) => (
                <Button
                  key={index}
                  variant={selectedEmoji === emoji ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedEmoji(emoji)}
                  className="text-2xl h-12 w-12 p-0"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          {/* Kaydet Butonu */}
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={!name.trim()}
          >
            {editingProject ? "Proje Güncelle" : "Proje Ekle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}