# 📋 Planner - Görev Yönetim Sistemi

Modern ve kullanıcı dostu bir görev yönetim uygulaması. Projeler, görevler, bölümler ve ekip işbirliği için kapsamlı özellikler sunar.

## 🚀 Özellikler

### 🎯 Görev Yönetimi
- ✅ Görev oluşturma, düzenleme ve silme
- 📊 Hiyerarşik görev yapısı (alt görevler)
- 🏷️ Etiket sistemi ile kategorilendirme
- 📅 Son tarih ve hatırlatıcı sistemi
- 📌 Görev sabitleme özelliği
- 🔄 Öncelik seviyeleri (Kritik, Yüksek, Orta, Düşük)

### 💬 Yorum Sistemi
- 💭 Görevlere yorum ekleme
- 🔄 İç içe yanıt sistemi
- 👤 Kullanıcı avatarları ile modern tasarım
- 🗑️ Yorum silme yetkisi
- 📊 Aktivite takibi entegrasyonu

### 📁 Proje Yönetimi
- 🏗️ Proje oluşturma ve düzenleme
- 📂 Bölüm bazlı görev organizasyonu
- 📈 Proje aktivite geçmişi
- 🎨 Emoji ve renk sistemi
- 📋 Proje tipleri desteği

### 👥 Kullanıcı Deneyimi
- 🔐 JWT tabanlı kimlik doğrulama
- 🌙 Koyu/açık tema desteği
- 📱 Responsive tasarım
- ⚡ Gerçek zamanlı güncellemeler
- 🎨 Modern UI bileşenleri (Radix UI)

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 15** - React tabanlı fullstack framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS v4** - Modern CSS framework
- **Radix UI** - Erişilebilir UI primitives
- **Zustand** - State management
- **Lucide React** - Modern ikonlar

### Backend & Database
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Güvenilir veritabanı
- **bcryptjs** - Şifre hashleme
- **JSON Web Tokens** - Kimlik doğrulama

### Development Tools
- **Bun** - Hızlı JavaScript runtime ve paket yöneticisi
- **ESLint** - Kod kalitesi
- **Prettier** - Kod formatlama

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- Bun
- PostgreSQL veritabanı

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd planner
```

### 2. Bağımlılıkları yükleyin
```bash
bun install
```

### 3. Ortam değişkenlerini ayarlayın
`.env` dosyası oluşturun:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/planner"
JWT_SECRET="your-jwt-secret-key"
```

### 4. Veritabanını hazırlayın
```bash
# Prisma istemcisini oluştur
bun run prisma:generate

# Veritabanı migration'larını çalıştır
bun run prisma:migrate

# Seed verilerini yükle
bun run prisma:seed
```

### 5. Geliştirme sunucusunu başlatın
```bash
bun run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 📜 Kullanılabilir Scriptler

```bash
# Geliştirme sunucusu (Turbopack ile)
bun run dev

# Üretim build'i
bun run build

# Üretim sunucusu
bun run start

# Kod kalitesi kontrolü
bun run lint

# Prisma komutları
bun run prisma:generate  # İstemci oluştur
bun run prisma:migrate   # Migration'ları çalıştır
bun run prisma:seed      # Seed verilerini yükle
bun run prisma:studio    # Veritabanı yönetim arayüzü
```

## 🏗️ Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Kimlik doğrulama rotaları
│   ├── (dashboard)/       # Ana uygulama rotaları
│   └── api/               # API endpoints
├── components/            # React bileşenleri
│   ├── auth/             # Kimlik doğrulama bileşenleri
│   ├── modals/           # Modal bileşenleri
│   ├── shared/           # Paylaşılan bileşenler
│   ├── task/             # Görev yönetimi bileşenleri
│   └── ui/               # Temel UI bileşenleri
├── lib/                  # Yardımcı fonksiyonlar
├── store/                # Zustand state management
├── types/                # TypeScript tip tanımları
└── generated/            # Prisma istemci dosyaları

prisma/
├── migrations/           # Veritabanı migration'ları
├── schema.prisma        # Veritabanı şeması
└── seed.ts              # Seed verileri
```

## 🎯 Kullanım

### Yeni Kullanıcı Kaydı
1. `/register` sayfasından kayıt olun
2. E-posta ve şifre ile giriş yapın

### Proje Oluşturma
1. Dashboard'dan "Yeni Proje" butonuna tıklayın
2. Proje adı, emoji ve tip seçin
3. İsteğe bağlı bölümler ekleyin

### Görev Yönetimi
1. Proje sayfasında "Yeni Görev" ekleyin
2. Başlık, açıklama ve öncelik belirleyin
3. Etiket ve son tarih atayabilirsiniz
4. Alt görevler oluşturarak hiyerarşi kurun

### Yorum Sistemi
1. Görev kartında yorum butonuna tıklayın
2. Yeni yorum yazın veya mevcut yorumlara yanıt verin
3. Kendi yorumlarınızı silebilirsiniz

## 🔧 Geliştirme Notları

### Kod Kuralları
- Türkçe yorumlar, İngilizce kod
- Fonksiyonel bileşenler ve hooks kullanımı
- TypeScript tip güvenliği
- Tailwind CSS ile styling

### Veritabanı Şeması
- User, Project, Task, Comment modelleri
- İlişkisel veri yapısı
- Cascade silme işlemleri
- Aktivite takip sistemi

### API Yapısı
- RESTful API endpoints
- JWT ile kimlik doğrulama
- Error handling
- Input validation

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://radix-ui.com/) - UI primitives
- [Lucide](https://lucide.dev/) - Icon library

---

⚡ **Bun** ile geliştirilmiştir - Hızlı ve modern JavaScript runtime!