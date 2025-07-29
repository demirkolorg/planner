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
  }

]

export function ColorThemeModal({ isOpen, onClose }: ColorThemeModalProps) {
  const { colorTheme, setColorTheme } = useThemeStore()

  const handleThemeSelect = (themeId: ColorTheme) => {
    setColorTheme(themeId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">Renk Teması</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid gap-3">
            {colorThemes.map((theme) => (
              <div
                key={theme.id}
                className={cn(
                  "group relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                  colorTheme === theme.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/30 hover:bg-accent/30"
                )}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {/* Color Preview */}
                <div className="flex gap-1.5">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                </div>
                
                {/* Theme Info */}
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{theme.name}</h4>
                  <p className="text-sm text-muted-foreground">{theme.description}</p>
                </div>
                
                {/* Check Icon */}
                <div className="flex-shrink-0">
                  {colorTheme === theme.id ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}