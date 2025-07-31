"use client"

import { ArrowLeft, CheckCircle, FolderKanban, Plus, Settings, Clock, Sparkles, MessageCircle, Pin, Tag, Calendar, Star, BarChart3, Target, Zap, RefreshCw, Keyboard, Search, Brain, Eye } from "lucide-react"
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

const newFeatures = [
  {
    title: "Google Calendar Entegrasyonu",
    description: "Görevlerinizi Google Calendar ile senkronize edin",
    icon: RefreshCw,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    version: "v2.1.0",
    isNew: true
  },
  {
    title: "AI Destekli Etiket Önerileri",
    description: "Görev içeriğine göre otomatik etiket önerileri alın",
    icon: Brain,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    version: "v2.0.5",
    isNew: true
  },
  {
    title: "Gelişmiş Ayarlar Sayfası",
    description: "Yeniden tasarlanan tab bazlı ayarlar arayüzü",
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    version: "v2.1.0",
    isNew: true
  },
  {
    title: "Keyboard Shortcuts",
    description: "Hızlı erişim için klavye kısayolları desteği",
    icon: Keyboard,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    version: "v2.0.0",
    isNew: false
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
                v2.1.0
              </Badge>
              <Badge variant="secondary" className="hidden sm:flex">
                Kaymakam için özel tasarım
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="quickstart" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
            <TabsTrigger value="quickstart" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Hızlı Başlangıç</span>
              <span className="sm:hidden">Başlangıç</span>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Son Güncellemeler</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Planner&apos;a eklenen yeni özellikler ve iyileştirmeler
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newFeatures.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader className={`${feature.bgColor} border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${feature.color}`}>
                          <feature.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {feature.version}
                          </CardDescription>
                        </div>
                      </div>
                      {feature.isNew && (
                        <Badge className="bg-green-500 text-white">
                          YENİ
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
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