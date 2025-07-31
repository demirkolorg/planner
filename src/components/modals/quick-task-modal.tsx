"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap } from "lucide-react"
import { analyzeQuickTask } from "@/lib/ai-quick-task"
import { useProjectStore } from "@/store/projectStore"
import { useTaskStore } from "@/store/taskStore"
import { useTagStore } from "@/store/tagStore"

interface QuickTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { projects, createProject, fetchProjects } = useProjectStore()
  const { createTask } = useTaskStore()
  const { tags, createTag, fetchTags } = useTagStore()

  // Modal açıldığında input'a focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Modal açıldığında gerekli verileri yükle
  useEffect(() => {
    if (isOpen) {
      fetchProjects()
      fetchTags()
    }
  }, [isOpen, fetchProjects, fetchTags])

  // Modal kapandığında temizle
  useEffect(() => {
    if (!isOpen) {
      setInput("")
    }
  }, [isOpen])

  // Hızlı Notlar projesini bul veya oluştur
  const getOrCreateQuickNotesProject = async () => {
    // Önce mevcut projeler arasından ara
    let quickNotesProject = projects.find(p => p.name === "Hızlı Notlar")
    
    if (!quickNotesProject) {
      try {
        // Yeni proje oluştur
        const newProject = await createProject("Hızlı Notlar", "📝")
        
        // Eğer createProject direkt proje objesi döndürürse onu kullan
        if (newProject && newProject.id) {
          return newProject
        }
        
        // Yoksa projeler listesini yenile ve bul
        await fetchProjects()
        quickNotesProject = projects.find(p => p.name === "Hızlı Notlar")
        
        if (!quickNotesProject) {
          throw new Error('Proje oluşturuldu ama bulunamadı')
        }
      } catch (error) {
        throw new Error('Hızlı Notlar projesi oluşturulamadı')
      }
    }
    
    return quickNotesProject
  }


  const handleSubmit = async () => {
    if (!input.trim()) return

    const taskTitle = input.trim() // Kullanıcının yazdığı veri direkt başlık olsun
    
    // Modal'ı hemen kapat
    onClose()
    
    // Arka planda işlemleri yap
    processQuickTask(taskTitle)
  }

  const processQuickTask = async (title: string) => {
    try {
      // Hızlı Notlar projesini hazırla
      const quickNotesProject = await getOrCreateQuickNotesProject()
      if (!quickNotesProject || !quickNotesProject.id) {
        throw new Error('Hızlı Notlar projesi oluşturulamadı')
      }

      // AI analizi arka planda yap (başlık hariç diğer veriler için)
      const analysis = await analyzeQuickTask(title)
      
      // Etiketleri hazırla (sadece isim olarak)
      const tagNames = analysis.tags || []
      
      // Priority mapping (AI'dan gelen değerler için)
      const priorityMap: Record<string, string> = {
        'CRITICAL': 'Kritik',
        'HIGH': 'Yüksek', 
        'MEDIUM': 'Orta',
        'LOW': 'Düşük',
        'NONE': 'Yok'
      }
      
      // Görevi oluştur - Başlık kullanıcının yazdığı, açıklama AI'dan
      const taskData = {
        title: title, // Kullanıcının yazdığı direkt başlık
        description: analysis.description, // AI'dan genişletilmiş açıklama
        projectId: quickNotesProject.id,
        sectionId: 'default',
        priority: priorityMap[analysis.priority] || 'Orta',
        dueDate: analysis.dueDate || undefined,
        tags: tagNames
      }
      
      await createTask(taskData)
      
      // Başarı bildirimi göster
      showSuccessNotification()
      
    } catch (error) {
      // Hata bildirimi göster
      showErrorNotification(error instanceof Error ? error.message : 'Bilinmeyen hata')
    }
  }

  const showSuccessNotification = () => {
    // Basit toast benzeri bildirim için window global'ına ekliyoruz
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('quickTaskSuccess', {
        detail: { message: 'Hızlı not eklendi! 📝' }
      })
      window.dispatchEvent(event)
    }
  }

  const showErrorNotification = (errorMessage: string) => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('quickTaskError', {
        detail: { message: `Hata: ${errorMessage}` }
      })
      window.dispatchEvent(event)
    }
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
        <DialogTitle className="sr-only">Hızlı Görev Ekle</DialogTitle>
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold">Hızlı Görev Ekle</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Ne yapmak istiyorsun? AI yardımıyla hızlıca görev oluştur
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+K</kbd> ile her yerden erişebilirsin
            </p>
          </div>

          {/* Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Örn: acil toplantı hazırlığı yap yarın"
              className="pr-12 h-12 text-base transition-all duration-200 focus:border-purple-400"
            />
            
            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!input.trim()}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
            >
              <div className="flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span className="text-xs">Ekle</span>
              </div>
            </Button>
          </div>



          {/* Shortcuts */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-4">
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> Oluştur</span>
              <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> Kapat</span>
            </div>
            <div className="text-purple-600 dark:text-purple-400">
              📝 Hızlı Notlar projesine eklenir
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}