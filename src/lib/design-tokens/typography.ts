/**
 * Typography Design Tokens - Poppins Font
 */

// Font families
export const FONT_FAMILIES = {
  sans: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'monospace']
} as const

// Poppins font weights
export const FONT_WEIGHTS = {
  light: '300',
  normal: '400',
  medium: '500', 
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

// Typography scale
export const TYPOGRAPHY_SCALE = {
  xs: { fontSize: '0.75rem', lineHeight: '1rem' },
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
  base: { fontSize: '1rem', lineHeight: '1.5rem' },
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
} as const

export type FontWeight = keyof typeof FONT_WEIGHTS
export type FontFamily = keyof typeof FONT_FAMILIES
export type TypographySize = keyof typeof TYPOGRAPHY_SCALE