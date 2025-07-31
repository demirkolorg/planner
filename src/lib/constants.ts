// Global constants for the application

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_STORAGE: 'planner-auth',
  THEME_STORAGE: 'planner-theme',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/',
  TODAY: '/today',
  SCHEDULED: '/thisweek',
  BOARD: '/board',
  SEARCH: '/search',
  TAGS: '/tags',
  COMPLETED: '/completed',
  OVERDUE: '/overdue',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Giriş başarılı',
    REGISTER: 'Kullanıcı başarıyla kaydedildi',
    LOGOUT: 'Çıkış yapıldı',
  },
  ERROR: {
    REQUIRED_FIELDS: 'Tüm alanlar gereklidir',
    INVALID_EMAIL: 'Geçerli bir email adresi giriniz',
    PASSWORD_TOO_SHORT: 'Şifre en az 6 karakter olmalıdır',
    PASSWORDS_NOT_MATCH: 'Şifreler eşleşmiyor',
    USER_NOT_FOUND: 'Kullanıcı bulunamadı',
    WRONG_PASSWORD: 'Şifre yanlış',
    EMAIL_ALREADY_EXISTS: 'Bu email adresi zaten kayıtlı',
    SERVER_ERROR: 'Sunucu hatası',
    GENERIC_ERROR: 'Bir hata oluştu',
  },
} as const;

// Form Fields
export const FORM_FIELDS = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  EMAIL: 'email',
  PASSWORD: 'password',
  RE_PASSWORD: 'rePassword',
} as const;

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Brand Colors - migrated to design tokens
import { BRAND_COLORS as DESIGN_TOKEN_BRAND_COLORS } from '@/lib/design-tokens'

export const BRAND_COLORS = DESIGN_TOKEN_BRAND_COLORS

// Legacy support
export const BRAND_COLOR = '#f59e0b'; // Deprecated: use BRAND_COLORS.PRIMARY

// Marka Sloganları - Ağaçkakan Metaforu
export const BRAND_SLOGANS = [
  // Ana Slogan
  "Hedefe Tık Tık.",
  
  // Odak ve Verimlilik Vurgulu
  "Büyük Projeler, Net Vuruşlar.",
  "Projenin Ritmi, Başarının Sesi.",
  "Odağınızı bulun, gerisini Planner halletsin.",
  "Dağınıklığı değil, hedefi yönetin.",
  
  // Metaforu Doğrudan Kullanan
  "Projenizin Ağaçkakanı.",
  "En zor projeleri bile tık tık bitirin.",
  "Tek tek görevler, büyük başarılar.",
  
  // Motivasyon ve Başarı Odaklı
  "Görevleri Değil, Geleceği Şekillendir.",
  "Adım adım değil, vuruş vuruş başarıya.",
  "Projeler tamamlanır, eserler ortaya çıkar.",
  
  // Ek Motivasyon Sloganları
  "Her tık, hedefe bir adım daha yakın.",
  "Kararlı vuruşların gücünü keşfedin.",
  "Ritminizi bulun, başarınızı yaratın.",
] as const

// Marka Anlatımı
export const BRAND_STORY = `En büyük projeler, en sağlam ağaç gövdeleri gibidir. İlk bakışta heybetli, aşılmaz ve karmaşık görünürler. Nereden başlayacağınızı bilemez, o devasa hedef karşısında enerjinizi nereye odaklayacağınızı kestiremezsiniz.

Doğada ise bu sorunun bir ustası var: Ağaçkakan.

Ağaçkakan, hedefini belirler ve tek bir noktaya odaklanır. Dikkati dağılmaz. Her vuruşu (tık!), bir öncekiyle aynı ritim ve kararlılıktadır. Tek bir vuruş ağacı devirmez, ama binlerce ritmik ve odaklanmış vuruş, en sert kabuğu bile delerek amaca ulaşır: bir yuva inşa etmek, bir hedefe varmak.

Planner, projenizin dijital ağaçkakanıdır.

Biz, o devasa projeyi sizin için yönetilebilir "tık"lara, yani net ve sıralı görevlere bölüyoruz. Planner ile ekibiniz, dikkatini dağıtan yüzlerce daldan sıyrılıp, projenin özüne, yani o tek ve önemli noktaya odaklanır.

Her bir görev, hedefe yönelik net bir vuruştur. Her "tamamlandı" işareti, projenizin ritmini oluşturan sestir. Planner, dağınıklığı ortadan kaldırır, ekibinizi aynı ritimde odaklar ve her bir "tık" ile hedefinize ne kadar yaklaştığınızı size gösterir.

Bizimle sadece görevleri tamamlamazsınız; sabırla, odaklanarak ve doğru ritimle kendi başarınızı inşa edersiniz.

Çünkü en büyük başarılar, kararlı vuruşların eseridir.`