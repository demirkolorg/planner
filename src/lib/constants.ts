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
  SCHEDULED: '/scheduled',
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

// Brand Colors
export const BRAND_COLOR = '#f59e0b';