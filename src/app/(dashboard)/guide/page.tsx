"use client"

import { ArrowLeft, CheckCircle, FolderKanban, Plus, Settings, Clock, Sparkles, MessageCircle, Pin, Tag, Calendar, Star, BarChart3, Target, Zap, RefreshCw, Keyboard, Search, Brain, Eye, CalendarX, StickyNote, Folder } from "lucide-react"
import { RiCalendarScheduleLine } from "react-icons/ri"
import { PiTagSimpleBold } from "react-icons/pi"
import { FaRegStar, FaRegCheckCircle } from "react-icons/fa"
import { BsPin } from "react-icons/bs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

const features = [
  {
    category: "Proje Yönetimi",
    icon: FolderKanban,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    items: [
      { name: "Proje Oluşturma", description: "AI destekli proje adı önerileri ile hızlı proje kurulumu" },
      { name: "Proje Türleri", description: "Kamu yönetimi, eğitim, sağlık gibi 8 farklı kategori" },
      { name: "Proje Timeline", description: "Tüm proje aktivitelerini takip edin" },
      { name: "Bölüm Yönetimi", description: "Projeleri bölümlere ayırarak organize edin" }
    ]
  },
  {
    category: "Görev Yönetimi", 
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    items: [
      { name: "Görev Oluşturma", description: "Hızlı görev ekleme ve detaylı görev tanımlama" },
      { name: "Alt Görevler", description: "Büyük görevleri parçalara bölerek yönetin" },
      { name: "Öncelik Seviyeleri", description: "Kritik, yüksek, orta, düşük öncelik seviyeleri" },
      { name: "Durum Takibi", description: "Beklemede, devam ediyor, tamamlandı durumları" }
    ]
  },
  {
    category: "Google Calendar",
    icon: RefreshCw,
    color: "text-red-600", 
    bgColor: "bg-red-50 dark:bg-red-950/20",
    items: [
      { name: "İki Yönlü Senkronizasyon", description: "Görevler Google Calendar ile otomatik senkronize edilir" },
      { name: "Planner Takvimi", description: "Özel Planner takvimi oluşturup yönetin" },
      { name: "Takvim Seçimi", description: "Hangi takvimlerden görev alacağınızı seçin" },
      { name: "Manuel Sync", description: "İsteğe bağlı manuel senkronizasyon seçeneği" }
    ]
  },
  {
    category: "AI Özellikler",
    icon: Brain,
    color: "text-violet-600", 
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    items: [
      { name: "Proje Adı Önerileri", description: "Kategori bazlı akıllı proje isimleri" },
      { name: "Etiket Önerileri", description: "Görev içeriğine göre otomatik etiket önerileri" },
      { name: "Görev Kategorilendirme", description: "AI ile otomatik görev sınıflandırması" },
      { name: "Akıllı Hatırlatıcılar", description: "Bağlamsal ve kişiselleştirilmiş hatırlatmalar" }
    ]
  },
  {
    category: "Zaman Yönetimi",
    icon: Clock,
    color: "text-purple-600", 
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    items: [
      { name: "Tarih Planlama", description: "Görevlere başlangıç ve bitiş tarihleri atayın" },
      { name: "Hatırlatıcılar", description: "Önemli görevler için otomatik hatırlatmalar" },
      { name: "Bugün Görünümü", description: "Günlük görevlerinizi kolayca görün" },
      { name: "Gecikmiş Takibi", description: "Süresi geçen görevleri takip edin" }
    ]
  },
  {
    category: "İşbirliği",
    icon: MessageCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20", 
    items: [
      { name: "Görev Yorumları", description: "Görevler hakkında ekip ile iletişim kurun" },
      { name: "Aktivite Geçmişi", description: "Tüm değişiklikleri timeline'da görün" },
      { name: "Durum Bildirimleri", description: "Görev güncellemelerinden haberdar olun" },
      { name: "Ekip Koordinasyonu", description: "Proje üyelerini organize edin" }
    ]
  },
  {
    category: "Organizasyon",
    icon: Tag,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    items: [
      { name: "Etiketleme", description: "Görevleri renkli etiketlerle kategorize edin" },
      { name: "Pano Sistemi", description: "Önemli görevleri panoya sabitleyin" },
      { name: "Filtreleme", description: "Gelişmiş filtreleme seçenekleri" },
      { name: "Arama", description: "Tüm görev ve projelerde hızlı arama" }
    ]
  },
  {
    category: "Raporlama",
    icon: BarChart3,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    items: [
      { name: "İlerleme Takibi", description: "Proje tamamlanma oranlarını görün" },
      { name: "Performans Grafikleri", description: "Görsel raporlar ve istatistikler" },
      { name: "Zaman Analizi", description: "Görevlerde harcanan zamanı analiz edin" },
      { name: "Verimlilik Ölçümü", description: "Ekip performansını değerlendirin" }
    ]
  }
]

const keyboardShortcuts = [
  { key: "Ctrl + K", description: "Hızlı görev ekleme modalını açar", category: "Görev" },
  { key: "Ctrl + N", description: "Yeni proje oluşturma modalını açar", category: "Proje" },
  { key: "Ctrl + /", description: "Arama sayfasını açar", category: "Navigasyon" },
  { key: "Ctrl + ,", description: "Ayarlar sayfasını açar", category: "Navigasyon" },
  { key: "Ctrl + H", description: "Anasayfaya gider", category: "Navigasyon" },
  { key: "Ctrl + P", description: "Projeler listesini açar", category: "Navigasyon" },
  { key: "Esc", description: "Açık modalleri kapatır", category: "Genel" },
  { key: "Tab", description: "Form elemanları arasında gezinir", category: "Genel" }
]


const sidebarPages = [
  {
    category: "Standart Hiyerarşik Sayfalar",
    description: "HierarchicalTaskList bileşeni kullanır, tam alt görev desteği",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    pages: [
      {
        name: "Bugün",
        icon: FaRegStar,
        route: "/today",
        purpose: "Günlük odaklanma için bugün bitiş tarihi olan görevleri görüntüler",
        filter: "task.dueDate === today && !task.completed",
        display: "Hiyerarşik ağaç yapısı, proje/etiket/öncelik grupları",
        hierarchy: "Tam destek - alt görev ekleme, tree connectors",
        features: ["Bugün odaklı filtreleme", "Dinamik sayı hesaplama", "Görünüm modları"],
        scenarios: ["Günlük görev planlaması", "Acil görevlerin takibi", "Günlük hedeflerin belirlenmesi"]
      },
      {
        name: "Bu Hafta", 
        icon: RiCalendarScheduleLine,
        route: "/thisweek",
        purpose: "Haftalık planlama için bu hafta bitiş tarihi olan görevleri takvim görünümünde gösterir",
        filter: "isTaskDueInCurrentWeek(task.dueDate)",
        display: "Haftalık takvim + hiyerarşik görev listeleri, gün bazlı gruplandırma",
        hierarchy: "Tam destek - her gün içinde hiyerarşik yapı",
        features: ["Haftalık progress bar", "Gün bazlı istatistikler", "Gecikmiş görev vurgulama"],
        scenarios: ["Haftalık iş planlaması", "Toplantı hazırlıkları", "Dönemsel görev takibi"]
      },
      {
        name: "Tamamlandı",
        icon: FaRegCheckCircle,
        route: "/completed", 
        purpose: "Başarı takibi için tamamlanan görevleri bugün/hafta/ay gruplarında gösterir",
        filter: "task.completed === true",
        display: "Zaman bazlı gruplandırma + hiyerarşik yapı",
        hierarchy: "Tam destek - tamamlanan alt görevler parent altında",
        features: ["Zaman bazlı filtreleme", "Tamamlanma istatistikleri", "Başarı özeti"],
        scenarios: ["İlerleme takibi", "Performans değerlendirmesi", "Motivasyon artırma"]
      },
      {
        name: "Gecikmiş",
        icon: CalendarX,
        route: "/overdue",
        purpose: "Kritik takip için bitiş tarihi geçmiş tamamlanmamış görevleri gösterir",
        filter: "task.dueDate < today && !task.completed",
        display: "Gecikme süresine göre renkli kodlama + hiyerarşik yapı",
        hierarchy: "Tam destek - gecikmiş alt görevler parent altında",
        features: ["Gecikme süresi hesaplama", "Kritik görev vurgulama", "Aciliyet sıralaması"],
        scenarios: ["Acil müdahale gereken görevler", "Risk yönetimi", "Öncelik belirleme"]
      },
      {
        name: "Etiketler",
        icon: PiTagSimpleBold,
        route: "/tags",
        purpose: "Kategorisel organizasyon için etiketli görevleri yönetir ve filtreler",
        filter: "task.tags.includes(selectedTag)",
        display: "Etiket listesi + seçilen etiketteki hiyerarşik görevler",
        hierarchy: "Tam destek - etiketli alt görev varsa parent'ı da gösterir",
        features: ["Etiket yönetimi", "Renk kodlaması", "Kök görev bulma algoritması"],
        scenarios: ["Kategorisel görev takibi", "Departman bazlı organizasyon", "Proje etiketleme"]
      },
      {
        name: "Pano",
        icon: BsPin,
        route: "/board",
        purpose: "Hızlı erişim için sabitlenmiş (pinned) görevleri gösterir",
        filter: "task.isPinned === true", 
        display: "Öncelik sırasına göre hiyerarşik yapı",
        hierarchy: "Tam destek - sabitlenmiş alt görevler parent altında",
        features: ["Pin/unpin toggle", "Öncelik bazlı sıralama", "Hızlı erişim"],
        scenarios: ["Önemli görev vurgulama", "Günlük takip", "VIP görev listesi"]
      },
      {
        name: "Projeler",
        icon: Folder,
        route: "/projects",
        purpose: "Kapsamlı proje yönetimi - section bazlı organizasyon ve tam hiyerarşik yapı",
        filter: "task.projectId === selectedProject",
        display: "Section accordion + hiyerarşik görev listeleri, sıralama seçenekleri",
        hierarchy: "En detaylı hiyerarşik yapı - 4 seviye derinlik",
        features: ["Section yönetimi", "Sıralama seçenekleri", "Proje notları", "Timeline görünümü"],
        scenarios: ["Büyük proje yönetimi", "Ekip koordinasyonu", "Detaylı planlama"]
      }
    ]
  },
  {
    category: "Özel Görünüm Sayfaları", 
    description: "TaskCard bileşeni kullanır, düz liste görünümü",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    pages: [
      {
        name: "Google Takvim",
        icon: Calendar,
        route: "/calendar-tasks",
        purpose: "Google Calendar entegrasyonu - takvim etkinliklerini görev olarak yönetir",
        filter: "task.taskType === 'CALENDAR'",
        display: "Haftalık/aylık takvim görünümü, TaskCard düz listesi",
        hierarchy: "YOK - Google Calendar kısıtı nedeniyle hiyerarşi desteklenmiyor",
        features: ["Takvim görünümü", "İki yönlü senkronizasyon", "Zaman çakışma kontrolü"],
        scenarios: ["Toplantı yönetimi", "Takvim entegrasyonu", "Etkinlik takibi"]
      },
      {
        name: "Hızlı Notlar", 
        icon: StickyNote,
        route: "/quick-notes",
        purpose: "Basit not sistemi - hızlı görev/hatırlatma oluşturma",
        filter: "task.taskType === 'QUICK_NOTE'",
        display: "Basit liste görünümü, TaskCard düz sıralama",
        hierarchy: "YOK - Tasarım kararı olarak basit yapı tercih edildi",
        features: ["Hızlı ekleme", "Minimal arayüz", "Not tarzı görevler"],
        scenarios: ["Hızlı not alma", "Günlük hatırlatmalar", "Basit görev listesi"]
      }
    ]
  }
]

const quickStart = [
  {
    step: 1,
    title: "İlk Projenizi Oluşturun",
    description: "Sidebar'dan + butonuna tıklayarak yeni proje oluşturun",
    icon: Plus,
    color: "text-blue-600"
  },
  {
    step: 2, 
    title: "Proje Türünü Seçin",
    description: "Kaymakam için özel tasarlanmış 8 kategori arasından seçim yapın",
    icon: Target,
    color: "text-green-600"
  },
  {
    step: 3,
    title: "AI ile Proje Adı Alın", 
    description: "Sparkles butonuna tıklayarak ilgili alana uygun proje adları alın",
    icon: Sparkles,
    color: "text-purple-600"
  },
  {
    step: 4,
    title: "Görevlerinizi Ekleyin",
    description: "Projenize bölümler ve görevler ekleyerek çalışmaya başlayın",
    icon: CheckCircle,
    color: "text-orange-600"
  }
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanım Kılavuzu</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Planner uygulamasının tüm özelliklerini keşfedin</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="hidden sm:flex">
                v1.4.0
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-8">
            <TabsTrigger value="quickstart" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Hızlı Başlangıç</span>
              <span className="sm:hidden">Başlangıç</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Sayfa Rehberi</span>
              <span className="sm:hidden">Sayfa</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Özellikler</span>
              <span className="sm:hidden">Özellik</span>
            </TabsTrigger>
            <TabsTrigger value="whats-new" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Yenilikler</span>
              <span className="sm:hidden">Yeni</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center space-x-2">
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Kısayollar</span>
              <span className="sm:hidden">Kısayol</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">İpuçları</span>
              <span className="sm:hidden">İpucu</span>
            </TabsTrigger>
          </TabsList>

          {/* Hızlı Başlangıç Tab */}
          <TabsContent value="quickstart" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Hızlı Başlangıç</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Planner ile ilçe yönetiminizi dijitalleştirin. 4 basit adımda başlayın.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStart.map((item) => (
                <Card key={item.step} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.step}. Adım
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Hemen başlamaya hazır mısınız?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-6">
                  İlk projenizi oluşturun ve Planner&apos;ın gücünü keşfedin.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Projenizi Oluşturun
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Ayarları Yapılandırın
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sayfa Rehberi Tab */}
          <TabsContent value="pages" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Sayfa Rehberi</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Sidebar&apos;daki her sayfanın amacını, görev filtreleme mantığını ve kullanım senaryolarını öğrenin
              </p>
            </div>

            <div className="space-y-8">
              {sidebarPages.map((category) => (
                <div key={category.category} className={`rounded-xl ${category.bgColor} ${category.borderColor} border p-6`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {category.category}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {category.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.pages.map((page) => (
                      <Card key={page.name} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <page.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center justify-between">
                                {page.name}
                                <Badge variant="outline" className="text-xs font-mono">
                                  {page.route}
                                </Badge>
                              </CardTitle>
                            </div>
                          </div>
                          <CardDescription className="text-sm leading-relaxed">
                            {page.purpose}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Filtre Mantığı */}
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <Search className="h-4 w-4 mr-2" />
                              Filtre Mantığı
                            </h5>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {page.filter}
                            </code>
                          </div>

                          {/* Görüntüleme */}
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <Eye className="h-4 w-4 mr-2" />
                              Görüntüleme
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {page.display}
                            </p>
                          </div>

                          {/* Hiyerarşi */}
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Alt Görev Desteği
                            </h5>
                            <p className={`text-sm ${page.hierarchy.includes('YOK') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {page.hierarchy}
                            </p>
                          </div>

                          {/* Özellikler */}
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Özellikler
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {page.features.map((feature, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Kullanım Senaryoları */}
                          <div>
                            <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Kullanım Senaryoları
                            </h5>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              {page.scenarios.map((scenario, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  <span>{scenario}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Teknik Notlar */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="py-6">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Teknik Detaylar
                    </h3>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <p>
                        <strong>HierarchicalTaskList:</strong> Tam hiyerarşik yapı, tree connectors, expand/collapse, alt görev ekleme
                      </p>
                      <p>
                        <strong>TaskCard:</strong> Düz liste görünümü, hiyerarşi yok, basit kart yapısı
                      </p>
                      <p>
                        <strong>Sidebar Sayıları:</strong> Her kartın sağ üst köşesindeki sayılar ilgili filtreleme mantığına göre hesaplanır
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Özellikler Tab */}
          <TabsContent value="features" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Tüm Özellikler</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Kamu yönetimi için özel olarak tasarlanmış kapsamlı özellik seti
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {features.map((feature) => (
                <Card key={feature.category} className="overflow-hidden">
                  <CardHeader className={`${feature.bgColor} border-b`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${feature.color}`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{feature.category}</CardTitle>
                        <CardDescription className="text-sm">
                          {feature.items.length} özellik
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {feature.items.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`p-1 rounded-full ${feature.bgColor} ${feature.color} mt-1`}>
                            <div className="w-2 h-2 rounded-full bg-current" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Yenilikler Tab */}
          <TabsContent value="whats-new" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Sürüm Notları</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Planner&apos;a eklenen yeni özellikler ve iyileştirmeler
              </p>
            </div>

            <div className="space-y-6">
              {/* Current Version */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-foreground">Güncel Sürüm</h3>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">v1.4.0</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  En son güncellemeyi kullanıyorsunuz. Tüm yeni özellikler ve iyileştirmeler aktif durumda.
                </p>
              </div>

              {/* Version History */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-6">Sürüm Geçmişi</h3>
                
                <div className="space-y-6">
                  {/* v1.4.0 */}
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-card-foreground">v1.4.0</h4>
                          <Badge variant="secondary" className="text-xs">7 Ağustos 2025</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🎯 Yeni Özellikler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Görev atama sistemi - ekip üyelerine görev atayabilme</li>
                              <li>• Proje üyesi yönetimi - projeler için ekip organizasyonu</li>
                              <li>• Atanmış görevler sayfası - size atanan görevleri görüntüleme</li>
                              <li>• Kullanıcı seçici bileşeni - gelişmiş kullanıcı seçimi</li>
                              <li>• Atama göstergesi - görev kartlarında atama bilgisi</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🔧 İyileştirmeler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Görev kartlarında atama bilgisi görüntüleniyor</li>
                              <li>• Sidebar'a "Bana Atananlar" sekmesi eklendi</li>
                              <li>• Proje detay sayfasında üye yönetimi eklenedi</li>
                              <li>• API rotalarında assignment desteği</li>
                              <li>• Database şemasında assignment ve project member tabloları</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🛠️ Teknik</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• TaskAssignment ve ProjectMember model'ları eklendi</li>
                              <li>• Assignment dropdown bileşeni</li>
                              <li>• User picker UI bileşeni</li>
                              <li>• Task assignment API endpoints</li>
                              <li>• Prisma migration for assignment system</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* v1.3.0 */}
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-card-foreground">v1.3.0</h4>
                          <Badge variant="outline" className="text-xs">5 Ağustos 2025</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🎯 Yeni Özellikler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Proje sabitleme sistemi - sadece sabitlenmiş projeler sidebar&apos;da gösteriliyor</li>
                              <li>• Optimistic UI - tüm değişiklikler anlık olarak yansıyor</li>
                              <li>• Sidebar kartlarında: Projeler → toplam proje sayısı, liste → bekleyen görev sayısı</li>
                              <li>• Sidebar kapalı konumda tüm ayarlar tek dropdown menüde toplanıyor</li>
                              <li>• Cyberpunk tarzı agresif sidebar tasarımı (sonra geri alındı)</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🔧 İyileştirmeler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Proje detay sayfası header butonları reorganize edildi - 6 buton → 3 element</li>
                              <li>• Special fields sayfası header tasarımı diğer sayfalarla uyumlu hale getirildi</li>
                              <li>• Font boyutları tüm sayfalarda standartlaştırıldı</li>
                              <li>• Etiketler sayfasında header kaldırıldı, filtre kısmı sade yapıldı</li>
                              <li>• Seçili etiket daha belirgin görünümle vurgulanıyor</li>
                              <li>• Sidebar compact tasarıma geçirildi - daha az alan kaplıyor</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🛠️ Teknik</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Project store&apos;da toggleProjectPin fonksiyonu optimistic UI ile çalışıyor</li>
                              <li>• Sistem projelerden &quot;Hızlı Notlar&quot; ve &quot;Planner Takvimi&quot; kaldırıldı</li>
                              <li>• Next.js 15 async params desteği eklendi</li>
                              <li>• DropdownMenuSeparator import hatası düzeltildi</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* v1.2.0 */}
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-muted-foreground/30 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-card-foreground">v1.2.0</h4>
                          <Badge variant="outline" className="text-xs">1 Ağustos 2025</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🎯 Yeni Özellikler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Hızlı görev ekleme butonu (⚡) sidebar&apos;a eklendi</li>
                              <li>• Ocean teması renk seçeneklerine eklendi</li>
                              <li>• Google Calendar ayarları 2 sütunlu tasarıma geçirildi</li>
                              <li>• Görev ekleme butonlarında tooltip ile kısayol bilgileri</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🔧 İyileştirmeler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Sidebar kapalı konumda buton düzeni optimize edildi</li>
                              <li>• Ayarlar sayfası tema renkleri ile uyumlu hale getirildi</li>
                              <li>• Google Calendar bilgilendirme modalı genişletildi</li>
                              <li>• Takvim seçimi için değişiklik kontrolü eklendi</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* v1.1.0 */}
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-muted-foreground/20 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-card-foreground">v1.1.0</h4>
                          <Badge variant="outline" className="text-xs">25 Temmuz 2025</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🎯 Yeni Özellikler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Hiyerarşik görev yapısı ve Level 4+ kısıtlaması</li>
                              <li>• Tree connector görselleri ile görsel hiyerarşi</li>
                              <li>• Database seviyesinde level storage</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🔧 İyileştirmeler</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Görev kartı indentasyon 24px&apos;den 48px&apos;e çıkarıldı</li>
                              <li>• Alt görev ekleme kısıtlamaları uygulandı</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* v1.0.0 */}
                  <div className="relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-muted-foreground/10 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-card-foreground">v1.0.0</h4>
                          <Badge variant="outline" className="text-xs">15 Temmuz 2025</Badge>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-card-foreground text-sm mb-1">🚀 İlk Sürüm</h5>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• Temel görev yönetimi özellikleri</li>
                              <li>• Proje ve etiket sistemi</li>
                              <li>• Google Calendar entegrasyonu</li>
                              <li>• Tema desteği</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Features */}
              <div className="bg-gradient-to-r from-secondary/20 to-accent/10 rounded-xl border border-secondary/30 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <h3 className="text-lg font-semibold text-card-foreground">Gelecek Güncellemeler</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-card-foreground text-sm mb-1">🔮 Planlanan Özellikler</h5>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Gelişmiş bildirim sistemi</li>
                      <li>• Mobil uygulama desteği</li>
                      <li>• Takım çalışması özellikleri</li>
                      <li>• Gelişmiş raporlama ve analitik</li>
                      <li>• Özelleştirilebilir dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Klavye Kısayolları Tab */}
          <TabsContent value="shortcuts" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Klavye Kısayolları</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Hızlı erişim için klavye kısayollarını öğrenin ve verimliliğinizi artırın
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(
                keyboardShortcuts.reduce((acc, shortcut) => {
                  if (!acc[shortcut.category]) acc[shortcut.category] = []
                  acc[shortcut.category].push(shortcut)
                  return acc
                }, {} as Record<string, typeof keyboardShortcuts>)
              ).map(([category, shortcuts]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {shortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {shortcut.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-3 font-mono text-xs">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* İpuçları Tab */}
          <TabsContent value="tips" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pro İpuçları</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Planner&apos;dan maksimum verim almanızı sağlayacak ipuçları
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-900 dark:text-blue-100 flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Görev Yönetimi</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Pin className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Önemli görevleri sabitleyin</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Pin butonunu kullanarak kritik görevleri panoda tutun</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Etiketleri kullanın</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Görevleri kategorize etmek için renkli etiketler oluşturun</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Brain className="h-5 w-5 text-violet-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">AI önerilerini kullanın</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Etiket önerileri için Sparkles butonuna tıklayın</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center space-x-2">
                    <RefreshCw className="h-5 w-5 text-red-500" />
                    <span>Google Calendar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">Senkronizasyonu aktifleştirin</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">Ayarlar sayfasından Google Calendar bağlantısı kurun</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">Takvim seçimi yapın</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">Hangi takvimlerden görev alacağınızı belirleyin</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">Manuel sync kullanın</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">Sidebar&apos;daki sync butonuyla anında senkronize edin</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-900 dark:text-orange-100 flex items-center space-x-2">
                    <Keyboard className="h-5 w-5 text-blue-500" />
                    <span>Hızlı Erişim</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Plus className="h-5 w-5 text-orange-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">Ctrl+K ile hızlı görev</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Herhangi bir sayfadan görev ekleme modalını açın</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Search className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">Arama özelliğini kullanın</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Ctrl+/ ile tüm görev ve projelerde arama yapın</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">Öncelikleri belirleyin</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Görevlere öncelik vererek odaklanmanızı sağlayın</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-xl text-purple-900 dark:text-purple-100 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    <span>Verimlilik</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Yorumları aktif kullanın</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Ekip ile iletişim için görev yorumlarını kullanın</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Alt görevler oluşturun</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Büyük görevleri küçük parçalara bölerek yönetin</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Tarih planlaması yapın</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Tüm görevlerinize uygun tarihler atayarak organize olun</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Destek Bölümü */}
            <Card className="bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Daha fazla yardıma mı ihtiyacınız var?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Planner kullanımında herhangi bir sorunuz varsa, destek ekibimizle iletişime geçebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link href="/">
                      <FolderKanban className="h-4 w-4 mr-2" />
                      Anasayfaya Dön
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Ayarlar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}