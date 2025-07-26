# Changelog

Planner uygulamasının tüm önemli değişiklikleri bu dosyada belgelenmiştir.

Biçim [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) standardına dayanır,
ve bu proje [Semantic Versioning](https://semver.org/spec/v2.0.0.html) kullanır.

## [Unreleased]

## [2.3.0] - 2025-01-26

### Added
- 💬 **Kapsamlı Yorum Sistemi**
  - Görevlere yorum ekleme özelliği
  - İç içe yanıt sistemi (nested replies)
  - Kullanıcı avatarları ile modern tasarım
  - Yorum silme yetkisi (sadece sahip)
  - Yorum sayısı göstergesi görev kartlarında
  - Tamamlanmış görevlerde yorum kısıtlaması
  - Aktivite takibi entegrasyonu

### Improved
- 🎨 **UI/UX Geliştirmeleri**
  - Modal scroll optimizasyonu
  - Input focus yönetimi iyileştirmeleri
  - Responsive tasarım güncellemeleri
  - Tooltip bilgilendirmeleri

### Technical
- 🗄️ Comment modeli veritabanına eklendi
- 🔗 Self-referencing relationships (parent-child comments)
- 🛡️ JWT authentication comment endpoints'lerinde
- ⚡ Optimistic UI updates
- 📝 TypeScript tip tanımları

### Fixed
- 🐛 Reply input focus sorunu çözüldü
- 🔄 Infinite loop durumu giderildi
- 📱 Modal scroll davranışı düzeltildi
- ⌨️ Cursor pozisyonu korunması

## [2.2.0] - 2025-01-25

### Added
- 📈 **Proje Aktivite Sistemi**
  - Proje bazlı aktivite takibi
  - Timeline modal bileşeni
  - Görev, bölüm ve proje aktivitelerini izleme
  - Detaylı aktivite geçmişi

### Improved
- 🎯 **Görev Yönetimi**
  - Görev tamamlama progress tracking
  - Sidebar'da proje tamamlanma oranları
  - "Gelen Kutusu" otomatik sıralama

### Technical
- 🗄️ ProjectActivity model eklendi
- 🔄 TaskActivity sistem entegrasyonu
- 📊 Activity tracking middleware

## [2.1.0] - 2025-01-20

### Added
- 🏷️ **Gelişmiş Etiket Sistemi**
  - Kullanıcı bazlı etiket yönetimi
  - Renk kodlaması sistemi
  - Çoklu etiket atama
  - Etiket filtreleme özellikleri

- ⏰ **Hatırlatıcı Sistemi**
  - Göreve özel hatırlatıcılar
  - Tarih ve saat bazlı uyarılar
  - Aktif/pasif hatırlatıcı durumları

- 🎯 **Öncelik Sistemi**
  - 5 seviyeli öncelik (Kritik, Yüksek, Orta, Düşük, Yok)
  - Renk kodlaması ile görsel ayrım
  - Öncelik bazlı sıralama

### Enhanced
- 📊 **Hiyerarşik Görev Yapısı**
  - Alt görev desteği (unlimited depth)
  - Tree view connector'ları
  - Parent-child ilişki yönetimi
  - Collapsed/expanded durumlar

- 📅 **Tarih Yönetimi**
  - Gelişmiş tarih seçici
  - Son tarih uyarıları
  - Geçmiş tarih vurgulaması
  - Timeline görünümü

### Technical
- 🗄️ Task, TaskTag, Reminder modelleri eklendi
- 🔗 İlişkisel veritabanı yapısı
- 📱 Responsive design optimizasyonları

## [2.0.0] - 2025-01-19

### Added
- 📂 **Bölüm (Section) Sistemi**
  - Proje içi görev organizasyonu
  - Bölüm bazlı görev grupplandırması
  - Drag & drop ile görev taşıma
  - Bölüm sıralama sistemi

- 🤖 **AI Entegrasyonu**
  - OpenAI ile bölüm adı önerisi
  - Akıllı kategorilendirme
  - Proje tipine göre öneriler

### Enhanced
- 🎨 **Modern UI Bileşenleri**
  - Radix UI primitives entegrasyonu
  - Tailwind CSS v4 upgrade
  - Koyu/açık tema desteği
  - Glassmorphism efektleri

### Technical
- ⚡ Next.js 15 upgrade
- 🔧 Bun runtime optimizasyonu
- 📦 ESM module sistemi
- 🛡️ TypeScript strict mode

## [1.2.0] - 2025-01-18

### Added
- 👤 **Kullanıcı Profil Sistemi**
  - Ad ve soyad alanları
  - Profil avatarı desteği
  - Kullanıcı bazlı etiket sistemi

- 🎨 **Proje Kişiselleştirme**
  - Emoji picker entegrasyonu
  - Proje renk sistemi
  - Görsel proje kimlikleri

### Improved
- 🔐 **Authentication Güvenliği**
  - bcryptjs ile şifre hashleme
  - JWT token yönetimi
  - Session persistence

### Technical
- 🗄️ User ve Project model güncellemeleri
- 🔗 Tag foreign key ilişkileri
- 📝 Migration optimizasyonları

## [1.1.0] - 2025-01-17

### Added
- 🏗️ **Temel Proje Yönetimi**
  - Proje oluşturma ve düzenleme
  - Görev atama sistemi
  - Proje bazlı organizasyon

- 📋 **Görev CRUD İşlemleri**
  - Görev oluşturma, okuma, güncelleme, silme
  - Görev tamamlama durumu
  - Temel görev bilgileri

### Technical
- 🗄️ Prisma ORM entegrasyonu
- 🐘 PostgreSQL veritabanı
- 🔄 Migration sistemi kurulumu

## [1.0.0] - 2025-01-17

### Added
- 🚀 **İlk Versiyon**
  - Next.js 15 ile temel proje yapısı
  - TypeScript konfigürasyonu
  - Tailwind CSS styling
  - Temel authentication sistemi
  - Dashboard layout

### Technical
- ⚡ Bun runtime kurulumu
- 📦 Package.json konfigürasyonu
- 🔧 ESLint ve Prettier setup
- 🗄️ Veritabanı bağlantı altyapısı

---

## Versiyon Notları

### Semantic Versioning Açıklaması
- **MAJOR** (X.0.0): Breaking changes, API değişiklikleri
- **MINOR** (0.X.0): Yeni özellikler, geriye uyumlu
- **PATCH** (0.0.X): Bug fixes, küçük iyileştirmeler

### Changelog Kategorileri
- **Added**: Yeni özellikler
- **Changed**: Mevcut özelliklerde değişiklikler
- **Deprecated**: Kaldırılacak özellikler
- **Removed**: Kaldırılan özellikler
- **Fixed**: Bug düzeltmeleri
- **Security**: Güvenlik güncellemeleri
- **Technical**: Teknik iyileştirmeler
- **Enhanced/Improved**: Mevcut özelliklerin geliştirilmesi

### İkonlar Anlamları
- 🚀 Yeni major özellik
- 💬 Yorum/mesajlaşma sistemi
- 📈 Analitik/raporlama
- 🏷️ Etiket/kategori sistemi
- ⏰ Zaman/tarih özellikleri
- 🎯 Görev yönetimi
- 📂 Organizasyon/struktur
- 🤖 AI/automation
- 🎨 UI/UX iyileştirmeleri
- 👤 Kullanıcı yönetimi
- 🔐 Güvenlik
- 🗄️ Veritabanı
- ⚡ Performans
- 🐛 Bug fix
- 📱 Responsive/mobile
- 🛡️ Güvenlik
- 🔧 Konfigürasyon
- 📦 Dependency
- 📝 Dokümantasyon

### Katkıda Bulunanlar
Bu projeyi geliştiren ve katkıda bulunan herkese teşekkürler:

- **Claude (Anthropic AI)** - Core development, feature implementation
- **Development Team** - Code review, testing, feedback

### Gelecek Planları
- 📱 Mobile app development
- 👥 Team collaboration features  
- 📊 Advanced analytics dashboard
- 🔄 Real-time synchronization
- 📧 Email notifications
- 🔗 Third-party integrations
- 📈 Performance monitoring
- 🌍 Internationalization (i18n)

---

**Son Güncelleme:** 26 Ocak 2025  
**Proje Durumu:** Aktif Geliştirme  
**Lisans:** MIT License