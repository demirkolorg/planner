"use client"

import { ArrowLeft, CheckCircle, FolderKanban, Plus, Settings, Clock, Sparkles, MessageCircle, Pin, Tag, Calendar, Star, BarChart3, Target, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
            <Badge variant="outline" className="hidden sm:flex">
              Kaymakam için özel tasarım
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Başlangıç Kılavuzu */}
        <section className="mb-12">
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
        </section>

        {/* Ana Özellikler */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ana Özellikler</h2>
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
        </section>

        {/* İpuçları */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl text-blue-900 dark:text-blue-100">Pro İpuçları</CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Verimliliğinizi artırmak için
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-yellow-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Önemli görevleri sabitleyin</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Pin butonunu kullanarak kritik görevleri panoda tutun</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Tag className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Etiketleri kullanın</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Görevleri kategorize etmek için renkli etiketler oluşturun</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Tarih planlaması yapın</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Tüm görevlerinize uygun tarihler atayarak organize olun</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="h-5 w-5 text-orange-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Yorumları aktif kullanın</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Ekip ile iletişim için görev yorumlarını kullanın</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Alt Bilgi */}
        <section className="text-center">
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="py-8">
              <div className="max-w-2xl mx-auto">
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
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}