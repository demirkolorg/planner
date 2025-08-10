/**
 * Typography Design Tokens - Poppins Font
 */

// Poppins font weights
export const FONT_WEIGHTS = {
  light: '300',
  normal: '400',
  medium: '500', 
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export type FontWeight = keyof typeof FONT_WEIGHTS