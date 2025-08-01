"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Keyboard, X } from "lucide-react"

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const shortcuts = [
  {
    keys: ["Ctrl", "J"],
    description: "Yeni görev oluştur",
    priority: true
  },
  {
    keys: ["Ctrl", "K"],
    description: "Hızlı görev ekleme modalını aç"
  },
  {
    keys: ["Ctrl", "S"],
    description: "Hızlı arama modalını aç"
  },
  {
    keys: ["Ctrl", "B"],
    description: "Sidebar'ı aç/kapat"
  },
  {
    keys: ["Esc"],
    description: "Modalları kapat"
  }
]

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-muted">
              <Keyboard className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Klavye Kısayolları
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Hızlı erişim için kısayolları kullan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                shortcut.priority 
                  ? "bg-primary/10 border border-primary/20 hover:bg-primary/15" 
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className={`text-sm ${
                shortcut.priority 
                  ? "text-primary font-medium" 
                  : "text-foreground"
              }`}>
                {shortcut.description}
              </span>
              
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <div key={keyIndex} className="flex items-center space-x-1">
                    <Badge 
                      variant={shortcut.priority ? "default" : "secondary"}
                      className="px-2 py-1 text-xs font-mono"
                    >
                      {key}
                    </Badge>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline" size="sm">
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}