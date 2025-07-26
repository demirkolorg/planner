/**
 * Centralized Color Design Tokens
 * Bu dosya tüm projede kullanılan renkleri merkezi olarak yönetir
 */

// Priority colors - semantic naming ile
export const PRIORITY_COLORS = {
  CRITICAL: "hsl(0 84% 60%)",    // #ef4444 -> modern HSL equivalent
  HIGH: "hsl(25 95% 53%)",       // #f97316 -> turuncu
  MEDIUM: "hsl(221 83% 53%)",    // #3b82f6 -> mavi  
  LOW: "hsl(258 90% 66%)",       // #8b5cf6 -> mor
  NONE: "hsl(220 9% 46%)",       // #9ca3af -> gri
} as const

// Status colors - semantic naming
export const STATUS_COLORS = {
  SUCCESS: "hsl(142 71% 45%)",   // yeşil
  WARNING: "hsl(38 92% 50%)",    // sarı
  ERROR: "hsl(0 84% 60%)",       // kırmızı
  INFO: "hsl(221 83% 53%)",      // mavi
} as const

// Brand colors
export const BRAND_COLORS = {
  PRIMARY: "hsl(38 92% 50%)",    // #f59e0b equivalent
  SECONDARY: "hsl(258 90% 66%)", // mor accent
} as const

// Gradient definitions
export const GRADIENTS = {
  PRIMARY: "linear-gradient(135deg, hsl(38 92% 50%) 0%, hsl(25 95% 53%) 100%)",
  VIOLET: "linear-gradient(135deg, hsl(258 90% 66%) 0%, hsl(280 100% 70%) 100%)",
  BLUE: "linear-gradient(135deg, hsl(221 83% 53%) 0%, hsl(240 100% 70%) 100%)",
  SUCCESS: "linear-gradient(135deg, hsl(142 71% 45%) 0%, hsl(160 84% 39%) 100%)",
} as const

// Priority mapping for backward compatibility
export const PRIORITIES = [
  { name: "Kritik", color: PRIORITY_COLORS.CRITICAL, key: "CRITICAL" },
  { name: "Yüksek", color: PRIORITY_COLORS.HIGH, key: "HIGH" },
  { name: "Orta", color: PRIORITY_COLORS.MEDIUM, key: "MEDIUM" },
  { name: "Düşük", color: PRIORITY_COLORS.LOW, key: "LOW" },
  { name: "Yok", color: PRIORITY_COLORS.NONE, key: "NONE" }
] as const

// Type exports
export type PriorityKey = keyof typeof PRIORITY_COLORS
export type StatusKey = keyof typeof STATUS_COLORS
export type Priority = typeof PRIORITIES[number]