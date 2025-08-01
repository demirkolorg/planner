"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Modal açıldığında input'a focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Modal kapandığında temizle
  useEffect(() => {
    if (!isOpen) {
      setInput("")
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!input.trim()) return

    const searchQuery = input.trim()
    
    // Modal'ı kapat
    onClose()
    
    // Arama sayfasına yönlendir
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg top-[20%] translate-y-0">
        <DialogTitle className="sr-only">Hızlı Arama</DialogTitle>
        <DialogDescription className="sr-only">
          Hızlı bir şekilde görev, proje veya etiket aramak için bu formu kullanın
        </DialogDescription>
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Hızlı Arama</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Görev, proje veya etiket ara
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+S</kbd> ile her yerden erişebilirsin
            </p>
          </div>

          {/* Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: acil görevler, proje adı, etiket..."
              className="pr-12 h-12 text-base transition-all duration-200 focus:border-blue-400"
            />
            
            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!input.trim()}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50"
            >
              <div className="flex items-center space-x-1">
                <Search className="h-3 w-3" />
                <span className="text-xs">Ara</span>
              </div>
            </Button>
          </div>

          {/* Shortcuts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-4">
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> Ara</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> Kapat</span>
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              🔍 Arama sayfasına yönlendirir
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}