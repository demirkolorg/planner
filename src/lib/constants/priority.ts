// Import and re-export from centralized design tokens
import { 
  PRIORITY_COLORS as DESIGN_TOKEN_COLORS,
  PRIORITY_HSL as DESIGN_TOKEN_HSL,
  PRIORITIES as DESIGN_TOKEN_PRIORITIES,
  type PriorityKey as DesignTokenPriorityKey,
  type Priority as DesignTokenPriority
} from '@/lib/design-tokens'

// Re-export with original names
export const PRIORITY_COLORS = DESIGN_TOKEN_COLORS
export const PRIORITY_HSL = DESIGN_TOKEN_HSL
export const PRIORITIES = DESIGN_TOKEN_PRIORITIES
export type PriorityKey = DesignTokenPriorityKey
export type Priority = DesignTokenPriority

// Backward compatibility mapping for Turkish keys
export const PRIORITY_COLORS_LEGACY = {
  KRITIK: DESIGN_TOKEN_COLORS.CRITICAL,
  YUKSEK: DESIGN_TOKEN_COLORS.HIGH, 
  ORTA: DESIGN_TOKEN_COLORS.MEDIUM,
  DUSUK: DESIGN_TOKEN_COLORS.LOW,
  YOK: DESIGN_TOKEN_COLORS.NONE
} as const