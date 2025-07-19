"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSection ? "Bölümü Düzenle" : "Yeni Bölüm"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Bölüm adı</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bölüm adı girin"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {editingSection ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}