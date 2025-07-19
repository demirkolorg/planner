"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface NewSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  editingSection?: { id: string, name: string } | null
}

export function NewSectionModal({ isOpen, onClose, onSave, editingSection }: NewSectionModalProps) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (editingSection) {
      setName(editingSection.name)
    } else {
      setName("")
    }
  }, [editingSection, isOpen])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim())
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {editingSection ? "Bölümü Düzenle" : "Yeni Bölüm"}
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
          {/* Bölüm İkonu */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>

          {/* Bölüm Adı */}
          <div className="space-y-2">
            <Label className="text-gray-300">Bölüm adı</Label>
            <div className="relative">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bölüm adı"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <Button
            onClick={handleSave}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!name.trim()}
          >
            {editingSection ? "Bölümü Güncelle" : "Bölüm Ekle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}