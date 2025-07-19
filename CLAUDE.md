# Proje Kuralları - Planner Uygulaması

## Paket Yöneticisi
- **Bun** kullanın, npm yerine
- `bun install` ile bağımlılıkları yükleyin
- `bun run <script>` ile scriptleri çalıştırın
- `bun add <package>` ile paket ekleyin
- `bun remove <package>` ile paket kaldırın

## Scriptler
- `bun run dev` - Turbopack ile geliştirme sunucusunu başlatır
- `bun run build` - Üretim için build alır
- `bun run start` - Üretim sunucusunu başlatır
- `bun run lint` - ESLint'i çalıştırır

## Veritabanı
- ORM olarak Prisma kullanın
- Veritabanı bağlantısı `src/lib/db.ts` dosyasında yapılandırılmıştır
- Geliştirme için `bunx prisma migrate dev` kullanın
- Şema değişikliklerinden sonra `bunx prisma generate` çalıştırın
- Veritabanı şeması `prisma/schema.prisma` dosyasındadır

## Kimlik Doğrulama
- Şifre hashleme için bcryptjs kullanın
- Kimlik doğrulama rotaları `src/app/api/auth/` dizinindedir
- Auth bileşenleri `src/components/auth/` dizinindedir
- Giriş sayfası: `src/app/(auth)/login/page.tsx`
- Kayıt sayfası: `src/app/(auth)/register/page.tsx`

## UI Bileşenleri
- Temel bileşenler için Radix UI primitives kullanın
- Bileşenler `src/components/ui/` dizinindedir
- Stil için Tailwind CSS kullanın
- Koşullu sınıflar için `clsx` ve `tailwind-merge` kullanın
- Bileşen varyantları için `class-variance-authority` kullanın
- İkonlar için Lucide React kullanın

## Dosya Yapısı
- Sayfalar `src/app/` dizininde (App Router)
- API rotaları `src/app/api/` dizininde
- Bileşenler `src/components/` dizininde
- Yardımcı fonksiyonlar `src/lib/` dizininde
- Auth sayfaları `src/app/(auth)/` rota grubunda

## TypeScript
- Tüm dosyalar için TypeScript kullanın
- Prisma client için tip tanımları otomatik oluşturulur
- API yanıtları ve bileşen props'ları için uygun tipleme yapın

## Stil
- Tailwind CSS v4 kullanın
- Global stiller `src/app/globals.css` dosyasında
- Tema için CSS değişkenleri kullanın
- Animasyonlar için Tailwind animate CSS kullanın

## Kod Kuralları
- Fonksiyonel bileşenler ve hook'lar kullanın
- Bileşenler için arrow function kullanın
- Props için destructuring kullanın
- API rotalarında uygun hata yönetimi yapın
- Uygun TypeScript interface ve type'lar kullanın
- Next.js App Router desenlerini takip edin

## Kod Yorumu Kuralları
- Tüm yorumlar Türkçe yazılacak
- Değişken, fonksiyon, class isimleri İngilizce olacak
- Commit mesajları Türkçe olacak
- Dosya isimleri İngilizce olacak

## Örnek Kod Yapısı
```typescript
// Kullanıcı giriş formunu yöneten bileşen
const LoginForm = () => {
  // Form state'ini yönetir
  const [email, setEmail] = useState('');
  
  // Giriş işlemini gerçekleştirir
  const handleLogin = async () => {
    // API çağrısı yapılır
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };
  
  return (
    // Form JSX'i burada
  );
};
```