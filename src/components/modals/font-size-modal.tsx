"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Type, Minus, Plus, RotateCcw } from "lucide-react"
import { useFontSizeStore } from "@/store/fontSizeStore"

interface FontSizeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FontSizeModal({ isOpen, onClose }: FontSizeModalProps) {
  const { fontSize, setFontSize, increaseFontSize, decreaseFontSize, resetFontSize } = useFontSizeStore()
  
  const MIN_FONT_SIZE = 12
  const MAX_FONT_SIZE = 20
  const DEFAULT_FONT_SIZE = 16

  const getFontSizeLabel = (size: number) => {
    if (size <= 12) return "Çok Küçük"
    if (size <= 14) return "Küçük"  
    if (size <= 16) return "Normal"
    if (size <= 18) return "Büyük"
    return "Çok Büyük"
  }

  const handleDecrease = () => {
    if (fontSize > MIN_FONT_SIZE) {
      decreaseFontSize()
    }
  }

  const handleIncrease = () => {
    if (fontSize < MAX_FONT_SIZE) {
      increaseFontSize()
    }
  }

  const handleReset = () => {
    resetFontSize()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Type className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Font Boyutu Ayarları
          </DialogTitle>
          <DialogDescription>
            Uygulamanın metin boyutunu kişiselleştirin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Size Preview */}
          <div className="text-center">
            <div 
              className="p-4 rounded-lg border bg-muted/30 transition-all duration-200"
              style={{ fontSize: `${fontSize}px` }}
            >
              <p className="font-medium mb-1">Örnek Metin</p>
              <p className="text-muted-foreground text-sm">
                Bu, seçilen font boyutunun nasıl görüneceğini gösterir
              </p>
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrease}
              disabled={fontSize <= MIN_FONT_SIZE}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="text-center min-w-[100px]">
              <div className="text-2xl font-bold text-primary">
                {fontSize}px
              </div>
              <div className="text-xs text-muted-foreground">
                {getFontSizeLabel(fontSize)}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrease}
              disabled={fontSize >= MAX_FONT_SIZE}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Font Size Range Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min ({MIN_FONT_SIZE}px)</span>
              <span>Varsayılan ({DEFAULT_FONT_SIZE}px)</span>
              <span>Max ({MAX_FONT_SIZE}px)</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full">
              <div 
                className="absolute h-2 bg-primary rounded-full transition-all duration-200"
                style={{
                  width: `${((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100}%`
                }}
              />
              <div 
                className="absolute w-3 h-3 bg-primary border-2 border-background rounded-full transform -translate-x-1/2 -translate-y-0.5 transition-all duration-200"
                style={{
                  left: `${((fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={fontSize === DEFAULT_FONT_SIZE}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Sıfırla</span>
            </Button>
            <Button onClick={onClose} className="min-w-[80px]">
              Tamam
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>💡 Font boyutu değişikliği tüm uygulamayı etkiler</p>
            <p>🔄 Ayarlar otomatik olarak kaydedilir</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}