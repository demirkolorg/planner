"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NewSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  editingSection?: { id: string, name: string } | null
  projectName?: string
  projectEmoji?: string
  existingSections?: string[]
}

export function NewSectionModal({ isOpen, onClose, onSave, editingSection, projectName, projectEmoji, existingSections = [] }: NewSectionModalProps) {
  const [name, setName] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Tek bir AI öneri oluştur
  const generateSingleAISuggestion = useCallback((projectName: string, projectEmoji?: string, existingSections: string[] = []) => {
    // Proje tipine göre öneriler
    const projectType = detectProjectType(projectName, projectEmoji)
    let suggestions: string[] = []
    
    switch (projectType) {
      case 'software':
        suggestions = ["Geliştirme", "Test", "Tasarım", "Araştırma", "Dokümantasyon", "İnceleme", "Dağıtım", "Backend", "Frontend", "Database", "API", "Security", "Deployment", "Bug Fixes", "Features", "Code Review"]
        break
      case 'marketing':
        suggestions = ["Kampanya", "İçerik", "Sosyal Medya", "Analiz", "Strateji", "Tasarım", "Pazarlama", "SEO", "E-posta", "Reklam", "Marka", "Müşteri", "Hedefleme", "Optimizasyon"]
        break
      case 'content':
        suggestions = ["Yazım", "Düzenleme", "Grafik", "Video", "Yayınlama", "İnceleme", "Planlama", "Çekim", "Montaj", "Ses", "Görsel", "İçerik Takvimi", "Blog"]
        break
      case 'business':
        suggestions = ["Strateji", "Pazarlama", "Satış", "Operasyon", "Finans", "İnsan Kaynakları", "Analiz", "Planlama", "Bütçe", "Rapor", "Toplantı", "Karar", "Süreç"]
        break
      case 'design':
        suggestions = ["Konsept", "Wireframe", "Prototyp", "Görsel Tasarım", "Kullanıcı Testleri", "İnceleme", "İterasyon", "UI", "UX", "Tipografi", "Renk", "Layout", "Brand"]
        break
      case 'education':
        suggestions = ["Müfredat", "Hazırlık", "Sunum", "Değerlendirme", "Materyaller", "Aktiviteler", "Geri Bildirim", "Ders", "Ödev", "Sınav", "Proje", "Kurs"]
        break
      case 'event':
        suggestions = ["Planlama", "Hazırlık", "Kayıt", "Lojistik", "Pazarlama", "Etkinlik", "Takip", "Mekan", "Catering", "Teknik", "Konuşmacı", "Katılımcı"]
        break
      case 'research':
        suggestions = ["Literatür", "Veri Toplama", "Analiz", "Deneyim", "Rapor", "Yayın", "Sunum", "Anket", "Mülakat", "Gözlem", "Bulgular", "Sonuç"]
        break
      case 'personal':
        suggestions = ["Başlamadan Önce", "Devam Eden", "İnceleme", "Tamamlandı", "Gelecek", "Notlar", "Fikirler", "Hedefler", "Alışkanlık", "Rutinler", "Öğrenme"]
        break
      default:
        suggestions = ["Planlama", "Geliştirme", "İnceleme", "Test", "Tamamlandı", "Beklemede", "Fikirler", "Başlangıç", "Süreç", "Sonuç", "Arşiv", "Notlar"]
    }
    
    // Mevcut bölümlerle çakışmayanları filtrele
    const filteredSuggestions = suggestions.filter(suggestion => 
      !existingSections.some(existing => 
        existing.toLowerCase().includes(suggestion.toLowerCase()) ||
        suggestion.toLowerCase().includes(existing.toLowerCase())
      )
    )
    
    // Rastgele bir öneri seç
    if (filteredSuggestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredSuggestions.length)
      return filteredSuggestions[randomIndex]
    }
    
    // Eğer hiç uygun öneri yoksa genel öneri ver
    const fallbackSuggestions = ["Yeni Bölüm", "Özel Bölüm", "Ekstra", "Diğer", "Genel"]
    const randomFallback = Math.floor(Math.random() * fallbackSuggestions.length)
    return fallbackSuggestions[randomFallback]
  }, [])

  // Proje tipini algıla
  const detectProjectType = (projectName: string, projectEmoji?: string): string => {
    const name = projectName.toLowerCase()
    
    // Emoji'ye göre tip algılama
    if (projectEmoji) {
      const codeEmojis = ['💻', '🔧', '⚙️', '🛠️', '📱', '💾', '🖥️']
      const marketingEmojis = ['📈', '📊', '🎯', '📢', '💰', '🚀', '📺']
      const designEmojis = ['🎨', '✏️', '🖌️', '🖼️', '📐', '🎭', '✨']
      const educationEmojis = ['📚', '🎓', '📖', '✏️', '📝', '🏫', '👨‍🏫']
      const eventEmojis = ['🎉', '🎊', '🎈', '🎪', '🎭', '🎬', '📅']
      const researchEmojis = ['🔬', '📊', '📈', '🧪', '📋', '📑', '🔍']
      
      if (codeEmojis.includes(projectEmoji)) return 'software'
      if (marketingEmojis.includes(projectEmoji)) return 'marketing'
      if (designEmojis.includes(projectEmoji)) return 'design'
      if (educationEmojis.includes(projectEmoji)) return 'education'
      if (eventEmojis.includes(projectEmoji)) return 'event'
      if (researchEmojis.includes(projectEmoji)) return 'research'
    }
    
    // İsme göre tip algılama
    if (name.includes('uygulama') || name.includes('web') || name.includes('sistem') || 
        name.includes('kod') || name.includes('geliştirme') || name.includes('app')) {
      return 'software'
    }
    
    if (name.includes('pazarlama') || name.includes('reklam') || name.includes('kampanya') || 
        name.includes('sosyal medya') || name.includes('marka')) {
      return 'marketing'
    }
    
    if (name.includes('içerik') || name.includes('blog') || name.includes('makale') || 
        name.includes('yazı') || name.includes('content')) {
      return 'content'
    }
    
    if (name.includes('iş') || name.includes('şirket') || name.includes('operasyon') || 
        name.includes('strateji') || name.includes('business')) {
      return 'business'
    }
    
    if (name.includes('tasarım') || name.includes('design') || name.includes('ui') || 
        name.includes('ux') || name.includes('grafik')) {
      return 'design'
    }
    
    if (name.includes('eğitim') || name.includes('kurs') || name.includes('ders') || 
        name.includes('öğretim') || name.includes('education')) {
      return 'education'
    }
    
    if (name.includes('etkinlik') || name.includes('event') || name.includes('konferans') || 
        name.includes('toplantı') || name.includes('organizasyon')) {
      return 'event'
    }
    
    if (name.includes('araştırma') || name.includes('research') || name.includes('analiz') || 
        name.includes('inceleme') || name.includes('çalışma')) {
      return 'research'
    }
    
    if (name.includes('kişisel') || name.includes('personal') || name.includes('günlük') || 
        name.includes('hobby') || name.includes('özel')) {
      return 'personal'
    }
    
    return 'general'
  }

  useEffect(() => {
    if (editingSection) {
      setName(editingSection.name)
    } else {
      setName("")
    }
  }, [editingSection, isOpen])

  // AI butonu tıklandığında çalışacak fonksiyon
  const handleAIGenerate = () => {
    if (!projectName) return

    setIsGeneratingAI(true)
    
    // Simulated AI generation delay
    setTimeout(() => {
      const aiSuggestion = generateSingleAISuggestion(projectName, projectEmoji, existingSections)
      setName(aiSuggestion)
      setIsGeneratingAI(false)
    }, 1000)
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim())
      onClose()
      // Reset modal state
      setName("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingSection ? "Bölümü Düzenle" : "Yeni Bölüm"}
            {!editingSection && projectName && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                {projectEmoji && <span>{projectEmoji}</span>}
                <span>{projectName}</span>
              </div>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingSection ? "Mevcut bölümü düzenleme penceresi" : "Yeni bölüm oluşturma penceresi"}: Bölüm adı belirleme
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Bölüm adı</Label>
            <div className="flex gap-2">
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
                className="flex-1"
              />
              {!editingSection && projectName && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAIGenerate}
                  disabled={isGeneratingAI}
                  className={cn(
                    "h-10 w-10 flex-shrink-0 transition-all duration-200",
                    "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700",
                    "dark:hover:bg-blue-950/30 dark:hover:border-blue-700 dark:hover:text-blue-300"
                  )}
                  title="AI ile bölüm adı öner"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {!editingSection && projectName && (
              <div className="text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1" />
                AI butonuna tıklayarak proje adına uygun bölüm adı önerisi alın
              </div>
            )}
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