/**
 * Typography Design Tokens
 * Standardized font scales and typography settings
 */

export const TYPOGRAPHY_SCALE = {
  // Heading scales
  heading: {
    h1: { 
      size: '2rem',        // 32px
      weight: '700',       // bold
      lineHeight: '2.5rem' // 40px
    },
    h2: { 
      size: '1.75rem',     // 28px
      weight: '600',       // semibold
      lineHeight: '2.25rem' // 36px
    },
    h3: { 
      size: '1.5rem',      // 24px
      weight: '600',       // semibold  
      lineHeight: '2rem'   // 32px
    },
    h4: {
      size: '1.25rem',     // 20px
      weight: '600',       // semibold
      lineHeight: '1.75rem' // 28px
    }
  },
  
  // Body text scales
  body: {
    lg: { 
      size: '1rem',        // 16px
      weight: '400',       // normal
      lineHeight: '1.5rem' // 24px
    },
    md: { 
      size: '0.875rem',    // 14px
      weight: '400',       // normal
      lineHeight: '1.25rem' // 20px
    },
    sm: { 
      size: '0.75rem',     // 12px
      weight: '400',       // normal
      lineHeight: '1rem'   // 16px
    },
    xs: {
      size: '0.6875rem',   // 11px
      weight: '400',       // normal
      lineHeight: '0.875rem' // 14px
    }
  },

  // Special text styles
  label: {
    size: '0.875rem',      // 14px
    weight: '500',         // medium
    lineHeight: '1.25rem'  // 20px
  },
  
  caption: {
    size: '0.75rem',       // 12px
    weight: '400',         // normal
    lineHeight: '1rem'     // 16px
  }
} as const

// Font families
export const FONT_FAMILIES = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'monospace'],
} as const

// Font weights
export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500', 
  semibold: '600',
  bold: '700',
} as const

export type TypographyHeading = keyof typeof TYPOGRAPHY_SCALE.heading
export type TypographyBody = keyof typeof TYPOGRAPHY_SCALE.body
export type FontWeight = keyof typeof FONT_WEIGHTS