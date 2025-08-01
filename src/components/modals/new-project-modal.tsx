"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Sparkles, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isProtectedProject, PROTECTED_PROJECT_MESSAGES } from "@/lib/project-utils"

// Emoji kategorileri
const emojiCategories = {
  "Favoriler": [
    "🚀", "💎", "🎯", "⚡", "🔥", "⭐", "💡", "🎨", "📱", "💻", "⌚", "🏆", "🎵", "📚", "✈️", "🚗",
    "🏠", "💰", "🎮", "📈", "🔧", "🎪", "🌟", "🎭", "🏋", "🎸", "📊", "🔮", "🎲", "🎺", "🎻", "🏹", "📥",
    "✅", "📝", "📋", "🗂️", "📂", "🎪", "🛠️", "⚙️", "🔖", "📌"
  ],
  "Seyahat": [
    "🚗", "🚕", "🚙", "🚌", "🚎", "🏎", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍", "🛵",
    "🚲", "🛴", "🛹", "✈️", "🛩", "🛫", "🛬", "🚀", "🛸", "🚁", "⛵", "🚤", "🛥", "🛳", "⛴", "🚢",
    "⚓", "🚇", "🚈", "🚝", "🚞", "🚋", "🚃", "🚂", "🚄", "🚅", "🚆", "🏰", "🏯", "🏟", "🎡", "🎢"
  ],
  "Aktivite": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
    "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸", "🥌",
    "🎿", "⛷", "🏂", "🪂", "🏋", "🤼", "🤸", "⛹", "🤺", "🏌", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗"
  ],
  "Nesne": [
    "⌚", "📱", "📲", "💻", "⌨", "🖥", "🖨", "🖱", "🖲", "🕹", "🗜", "💽", "💾", "💿", "📀", "📼",
    "📷", "📸", "📹", "🎥", "📽", "🎞", "📞", "☎", "📟", "📠", "📺", "📻", "🎙", "🎚", "🎛", "🧭",
    "⏱", "⏲", "⏰", "🕰", "📡", "🔋", "🔌", "💡", "🔦", "🕯", "🪔", "🧯", "🛢", "💸", "💵", "💴"
  ],
  "Sembol": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
    "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
    "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴"
  ]
}

// Proje türleri ve özel öneriler
const projectTypes = {
  "Kamu Yönetimi": {
    emoji: "🏛️",
    suggestions: [
      "E-Devlet Hizmetleri Modernizasyonu", "Vatandaş Memnuniyet Projesi", "Dijital Dönüşüm İnisiyatifi",
      "Kamu Hizmet Kalitesi Artırma", "Bürokrasi Azaltma Çalışması", "Hizmet Süreçleri İyileştirme",
      "Vatandaş Odaklı Hizmet Tasarımı", "İdari Kapasite Güçlendirme", "Şeffaflık ve Hesap Verebilirlik",
      "Kamu Personeli Eğitim Programı", "Hizmet Standartları Belirleme", "Performans Yönetim Sistemi"
    ]
  },
  "Eğitim": {
    emoji: "🎓",
    suggestions: [
      "Okul Öncesi Eğitim Güçlendirme", "Dijital Eğitim Altyapısı", "Öğretmen Mesleki Gelişimi",
      "Eğitimde Fırsat Eşitliği", "STEM Eğitimi Yaygınlaştırma", "Mesleki Eğitim Modernizasyonu",
      "Özel Eğitim Hizmetleri", "Hayat Boyu Öğrenme Programı", "Eğitim Kalitesi İzleme",
      "Okul Güvenliği ve Sağlığı", "Aile Katılımı Projesi", "Eğitim Teknolojileri Entegrasyonu"
    ]
  },
  "Sağlık": {
    emoji: "🏥",
    suggestions: [
      "Birinci Basamak Sağlık Güçlendirme", "Koruyucu Sağlık Hizmetleri", "Sağlık Turizmi Geliştirme",
      "Acil Sağlık Hizmetleri İyileştirme", "Toplum Sağlığı Taramaları", "Sağlık Teknolojileri",
      "Yaşlı Bakım Hizmetleri", "Ana Çocuk Sağlığı Programı", "Ruh Sağlığı Hizmetleri",
      "Sağlık Bilgi Sistemi", "Tıbbi Atık Yönetimi", "Sağlık Personeli Eğitimi"
    ]
  },
  "Altyapı": {
    emoji: "🏗️",
    suggestions: [
      "Ulaştırma Master Planı", "İçme Suyu Kalitesi Projesi", "Atık Su Arıtma Sistemi",
      "Kentsel Dönüşüm Projesi", "Akıllı Şehir Altyapısı", "Enerji Verimliliği Programı",
      "Yeşil Bina Sertifikasyonu", "Karayolu İyileştirme", "Köprü ve Tünel Projeleri",
      "Park ve Rekreasyon Alanları", "Bisiklet Yolu Ağı", "Toplu Taşıma Optimizasyonu"
    ]
  },
  "Güvenlik": {
    emoji: "🛡️",
    suggestions: [
      "Afet Risk Azaltma Planı", "Güvenli Şehir Projesi", "Siber Güvenlik Altyapısı",
      "İtfaiye Hizmetleri Modernizasyonu", "Acil Durum Koordinasyonu", "Kriz Yönetim Merkezi",
      "Toplum Destekli Güvenlik", "Trafik Güvenliği Kampanyası", "Doğal Afet Hazırlığı",
      "Güvenlik Kamerası Sistemi", "Acil Çağrı Merkezi", "Güvenlik Personeli Eğitimi"
    ]
  },
  "Ekonomi": {
    emoji: "💼",
    suggestions: [
      "KOBİ Destekleme Programı", "Girişimcilik Ekosistemi", "Yatırım Teşvik Sistemi",
      "İş Gücü Geliştirme Programı", "Ekonomik Kalkınma Stratejisi", "İnovasyon Merkezi Kurulumu",
      "Tarımsal Üretim Destekleme", "Turizm Potansiyeli Değerlendirme", "Organize Sanayi Bölgesi",
      "Teknoloji Transfer Ofisi", "İhracat Geliştirme Programı", "Finansal Okuryazarlık Eğitimi"
    ]
  },
  "Çevre": {
    emoji: "🌱",
    suggestions: [
      "Çevre Koruma Master Planı", "Karbon Ayak İzi Azaltma", "Geri Dönüşüm Sistemi",
      "Hava Kalitesi İzleme", "Su Kaynaklarını Koruma", "Biyoçeşitlilik Koruma",
      "Yeşil Alan Artırma", "Temiz Enerji Projesi", "Çevre Eğitimi Programı",
      "Atık Azaltma Kampanyası", "Ekolojik Tarım Destekleme", "İklim Değişikliği Adaptasyonu"
    ]
  },
  "Sosyal Hizmetler": {
    emoji: "🤝",
    suggestions: [
      "Engelli Dostu Şehir Projesi", "Yaşlı Destek Programı", "Çocuk Koruma Hizmetleri",
      "Kadın Güçlendirme Programı", "Gençlik Projeleri", "Sosyal Yardım Koordinasyonu",
      "Toplumsal Cinsiyet Eşitliği", "Aile Danışmanlık Hizmetleri", "Sosyal Kaynaşma Programı",
      "Dezavantajlı Gruplar Destekleme", "Gönüllülük Platformu", "Sosyal İçerme Projeleri"
    ]
  }
}

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, emoji: string) => void
  editingProject?: { id: string, name: string, emoji: string } | null
}

export function NewProjectModal({ isOpen, onClose, onSave, editingProject }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🚀")
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof emojiCategories>("Favoriler")
  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [selectedProjectType, setSelectedProjectType] = useState<keyof typeof projectTypes>("Kamu Yönetimi")
  
  // Korumalı proje kontrolü
  const isEditingProtectedProject = editingProject && isProtectedProject(editingProject.name)

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name)
      setSelectedEmoji(editingProject.emoji || "🚀")
    } else {
      setName("")
      setSelectedEmoji("🚀")
    }
    setSelectedCategory("Favoriler")
  }, [editingProject, isOpen])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), selectedEmoji)
      onClose()
    }
  }

  const getCurrentEmojis = () => {
    return emojiCategories[selectedCategory]
  }

  // AI proje adı önerisi
  const generateProjectName = async () => {
    setIsGeneratingName(true)
    try {
      // Seçilen proje türüne göre öneriler al
      const suggestions = projectTypes[selectedProjectType].suggestions
      
      // Rastgele bir öneri seç
      const randomIndex = Math.floor(Math.random() * suggestions.length)
      const suggestion = suggestions[randomIndex]
      
      // Biraz gecikme ekle (gerçek AI hissi için)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setName(suggestion)
      
      // İlgili emoji'yi de otomatik seç
      setSelectedEmoji(projectTypes[selectedProjectType].emoji)
    } catch (error) {
      console.error('AI öneri hatası:', error)
    } finally {
      setIsGeneratingName(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingProject ? "Proje Düzenle" : "Yeni Proje"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editingProject ? "Mevcut projeyi düzenleme penceresi" : "Yeni proje oluşturma penceresi"}: Proje adı, emoji ve türü seçimi
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Korumalı proje uyarısı */}
          {isEditingProtectedProject && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {PROTECTED_PROJECT_MESSAGES.EDIT}
              </p>
            </div>
          )}

          {/* Proje İkonu */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-3xl">
              {selectedEmoji}
            </div>
          </div>

          {/* Proje Türü */}
          {!isEditingProtectedProject && (
            <div className="space-y-2">
              <Label>Proje türü</Label>
              <Select value={selectedProjectType} onValueChange={(value: keyof typeof projectTypes) => setSelectedProjectType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Proje türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(projectTypes).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <span>{config.emoji}</span>
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Proje Adı */}
          <div className="space-y-2">
            <Label>Proje adı</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Proje adı"
                className="flex-1"
                disabled={isEditingProtectedProject}
              />
              {!isEditingProtectedProject && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateProjectName}
                  disabled={isGeneratingName}
                  className="shrink-0"
                  title={`${selectedProjectType} alanında AI ile proje adı öner`}
                >
                  {isGeneratingName ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {!isEditingProtectedProject && (
              <p className="text-xs text-muted-foreground">
                AI, {selectedProjectType.toLowerCase()} alanına uygun proje adları önerecek
              </p>
            )}
          </div>

          {/* Emoji Kategorileri */}
          {!isEditingProtectedProject && (
            <div className="space-y-4">
              <Label>Emoji Kategorisi</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(emojiCategories).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category as keyof typeof emojiCategories)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Seçimi */}
          {!isEditingProtectedProject && (
            <div className="space-y-4">
              <Label>{selectedCategory}</Label>
              <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                {getCurrentEmojis().map((emoji, index) => (
                  <Button
                    key={index}
                    variant={selectedEmoji === emoji ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedEmoji(emoji)}
                    className="text-2xl h-12 w-12 p-0"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Kaydet Butonu */}
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={!name.trim() || (isEditingProtectedProject && (name !== editingProject?.name || selectedEmoji !== editingProject?.emoji))}
          >
            {editingProject ? "Proje Güncelle" : "Proje Ekle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}