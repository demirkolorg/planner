"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { CustomFieldModalProps } from "@/types/custom-field"

export function CustomFieldModal({ 
  isOpen, 
  onClose, 
  onSave, 
  editingField, 
  existingKeys = [] 
}: CustomFieldModalProps) {
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Modal açıldığında verileri set et
  useEffect(() => {
    if (isOpen) {
      if (editingField) {
        setKey(editingField.key)
        setValue(editingField.value)
      } else {
        setKey("")
        setValue("")
      }
      setError("")
    }
  }, [isOpen, editingField])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!key.trim() || !value.trim()) {
      setError("Hem özel alan adı hem de değeri gereklidir")
      return
    }

    // Aynı key'in kullanılıp kullanılmadığını kontrol et (düzenleme durumunda mevcut alan hariç)
    const trimmedKey = key.trim()
    const isDuplicate = existingKeys.some(existingKey => 
      existingKey.toLowerCase() === trimmedKey.toLowerCase() && 
      (!editingField || existingField.key.toLowerCase() !== trimmedKey.toLowerCase())
    )

    if (isDuplicate) {
      setError("Bu özel alan adı zaten kullanılıyor")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onSave(trimmedKey, value.trim())
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      setError(error instanceof Error ? error.message : "Bir hata oluştu")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingField ? "Özel Alanı Düzenle" : "Yeni Özel Alan Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Üst: Özel Alan Adı */}
            <div className="space-y-2">
              <Label htmlFor="key">Özel Alan Adı</Label>
              <Input
                id="key"
                placeholder="Örn: İhale Tarihi, Müteahhit Firma, Proje Bütçesi"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {/* Alt: Değeri */}
            <div className="space-y-2">
              <Label htmlFor="value">Değeri</Label>
              <Textarea
                id="value"
                placeholder="Örn: 19.08.2025 veya daha uzun açıklamalar..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
                rows={3}
                required
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingField ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}