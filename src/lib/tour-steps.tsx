import React from 'react'
import { StepType } from '@reactour/tour'

export const onboardingSteps: StepType[] = [
  {
    selector: '[data-tour="welcome"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-lg font-semibold">Planner'a Hoş geldin!</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Görev yönetiminde uzmanlaşmak için bu kısa turu tamamlayalım. 
          Temel özellikleri keşfedecek ve daha verimli çalışmaya başlayacaksın!
        </p>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>⏱️ Yaklaşık 2 dakika</span>
          <span>•</span>
          <span>7 adım</span>
        </div>
      </div>
    ),
    position: 'center'
  },
  {
    selector: '[data-tour="new-task-button"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">➕</span>
          <h3 className="font-semibold">Yeni Görev Oluştur</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          İlk görevini buradan oluşturabilirsin. Detaylı özellikler, tarih seçimi ve AI desteği ile güçlü görevler oluştur.
        </p>
        <div className="flex items-center space-x-2 px-3 py-2 bg-primary/10 rounded-lg">
          <kbd className="px-2 py-1 text-xs bg-background border rounded">Ctrl+K</kbd>
          <span className="text-xs text-muted-foreground">ile hızlı görev ekle</span>
        </div>
      </div>
    ),
    position: 'bottom'
  },
  {
    selector: '[data-tour="sidebar"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📁</span>
          <h3 className="font-semibold">Navigasyon Menüsü</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Sol menüden projelerini, etiketlerini ve görev kategorilerini yönetebilirsin.
        </p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Bugün, Bu Hafta - Zaman kategorileri</li>
          <li>• Projeler - Büyük hedeflerini organize et</li>
          <li>• Etiketler - Görevlerini kategorilere ayır</li>
        </ul>
      </div>
    ),
    position: 'right'
  },
  {
    selector: '[data-tour="stats-cards"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📊</span>
          <h3 className="font-semibold">İlerleme İstatistikleri</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Bu kartlar ile günlük, haftalık ve genel ilerleme durumunu takip edebilirsin.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
            <span className="font-medium">Toplam Proje</span>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
            <span className="font-medium">Tamamlanan</span>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
            <span className="font-medium">Yüksek Öncelik</span>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
            <span className="font-medium">İlerleme Oranı</span>
          </div>
        </div>
      </div>
    ),
    position: 'bottom'
  },
  {
    selector: '[data-tour="task-categories"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📅</span>
          <h3 className="font-semibold">Akıllı Görev Kategorileri</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Görevlerin otomatik olarak tarih ve öncelik durumuna göre kategorilere ayrılır.
        </p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Süresi Geçmiş - Acil eylem gerekli</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Bugün Bitiyor - Bugün tamamlanmalı</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Yaklaşan - Bu hafta ve sonraki hafta</span>
          </div>
        </div>
      </div>
    ),
    position: 'top'
  },
  {
    selector: '[data-tour="settings-hint"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🔗</span>
          <h3 className="font-semibold">Google Calendar Entegrasyonu</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ayarlar sayfasından Google Calendar'ını bağlayarak görevlerini takvimde de görebilirsin.
        </p>
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg">
          <div className="text-xs font-medium mb-1">📱 Senkronizasyon Özellikleri:</div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• Görevler otomatik takvim etkinliği olur</li>
            <li>• Tarih ve saat senkronizasyonu</li>
            <li>• Tamamlanan görevler güncellenir</li>
          </ul>
        </div>
      </div>
    ),
    position: 'center'
  },
  {
    selector: '[data-tour="completion"]',
    content: (
      <div className="space-y-4 text-center">
        <div className="text-4xl">🎉</div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Harika! Tür Tamamlandı</h3>
          <p className="text-sm text-muted-foreground">
            Artık Planner'ın temel özelliklerini biliyorsun. Hedefe tık tık ulaşmaya başlayabilirsin!
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">💡 İpucu:</div>
          <p className="text-xs text-muted-foreground">
            Bu turu istediğin zaman Ayarlar {'>'} Yardım bölümünden tekrar başlatabilirsin.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2 pt-2">
          <span className="text-sm font-medium text-primary">Ağaçkakan gibi kararlı ol! 🪶</span>
        </div>
      </div>
    ),
    position: 'center'
  }
]

export const featureTourSteps: Record<string, StepType[]> = {
  'google-calendar': [
    {
      selector: '[data-tour="google-connect"]',
      content: (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📅</span>
            <h3 className="font-semibold">Google Calendar Bağlantısı</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Bu butona tıklayarak Google hesabınla bağlantı kurabilirsin.
          </p>
        </div>
      ),
      position: 'bottom'
    },
    {
      selector: '[data-tour="sync-options"]',
      content: (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚙️</span>
            <h3 className="font-semibold">Senkronizasyon Ayarları</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Hangi görevlerin senkronize edileceğini buradan ayarlayabilirsin.
          </p>
        </div>
      ),
      position: 'top'
    }
  ]
}

// Tour konfigürasyonu
export const tourConfig = {
  padding: 10,
  rounded: 8,
  maskSpace: 5,
  disableInteraction: false,
  showCloseButton: true,
  showNavigation: true,
  showBadge: true,
  showDots: true,
  scrollSmooth: true,
  className: 'planner-tour'
}