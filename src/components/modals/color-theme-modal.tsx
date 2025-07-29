"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useThemeStore, ColorTheme } from "@/store/themeStore"
import { Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface ColorThemeModalProps {
  isOpen: boolean
  onClose: () => void
}

const colorThemes: { 
  id: ColorTheme; 
  name: string; 
  description: string; 
  primaryColor: string; 
  secondaryColor: string;
  accentColor: string;
}[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Klasik siyah beyaz tema',
    primaryColor: '#333333',
    secondaryColor: '#f8f8f8',
    accentColor: '#666666'
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Doğa temalı yeşil tonları',
    primaryColor: '#22c55e',
    secondaryColor: '#dcfce7',
    accentColor: '#16a34a'
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Sıcak sarı ve turuncu tonları',
    primaryColor: '#f59e0b',
    secondaryColor: '#fffbeb',
    accentColor: '#d97706'
  },
  {
    id: 'boldtech',
    name: 'Bold Tech',
    description: 'Modern mor ve teknoloji teması',
    primaryColor: '#8b5cf6',
    secondaryColor: '#f3f4f6',
    accentColor: '#7c3aed'
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Supabase stili yeşil tema',
    primaryColor: '#10b981',
    secondaryColor: '#f0fdf4',
    accentColor: '#059669'
  },
  
  {
    id: 'quantum',
    name: 'Quantum',
    description: 'Quantum stili rose tema',
    primaryColor: '#ff6bef',
    secondaryColor: '#46204f',
    accentColor: '#5a1f5d'
  },
  {
    id: 'perpetuity',
    name: 'Perpetuity',
    description: 'Sakin mavi tonları teması',
    primaryColor: '#4a90c2',
    secondaryColor: '#e8f2f7',
    accentColor: '#2563eb'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    description: 'Parlak sarı tonları teması',
    primaryColor: '#fbbf24',
    secondaryColor: '#fffbeb',
    accentColor: '#f59e0b'
  },
  {
    id: 'red',
    name: 'Red',
    description: 'Güçlü kırmızı tonları teması',
    primaryColor: '#dc2626',
    secondaryColor: '#fef2f2',
    accentColor: '#b91c1c'
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Zarif pembe tonları teması',
    primaryColor: '#e11d48',
    secondaryColor: '#fff1f2',
    accentColor: '#be185d'
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'Canlı turuncu tonları teması',
    primaryColor: '#ea580c',
    secondaryColor: '#fff7ed',
    accentColor: '#c2410c'
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Taze yeşil tonları teması',
    primaryColor: '#16a34a',
    secondaryColor: '#f0fdf4',
    accentColor: '#15803d'
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Sakin mavi tonları teması',
    primaryColor: '#2563eb',
    secondaryColor: '#eff6ff',
    accentColor: '#1d4ed8'
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Mistik mor tonları teması',
    primaryColor: '#7c3aed',
    secondaryColor: '#f5f3ff',
    accentColor: '#6d28d9'
  }

]

export function ColorThemeModal({ isOpen, onClose }: ColorThemeModalProps) {
  const { colorTheme, setColorTheme } = useThemeStore()

  const handleThemeSelect = (themeId: ColorTheme) => {
    setColorTheme(themeId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">Renk Teması Seçin</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin-hover">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorThemes.map((theme) => (
              <div
                key={theme.id}
                className={cn(
                  "group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
                  colorTheme === theme.id 
                    ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" 
                    : "border-border hover:border-primary/40 hover:bg-accent/50"
                )}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {/* Selected indicator */}
                {colorTheme === theme.id && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                
                {/* Color Preview */}
                <div className="flex justify-center gap-1 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                
                {/* Theme Info */}
                <div className="text-center">
                  <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{theme.description}</p>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Tema seçimi anında uygulanır
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}