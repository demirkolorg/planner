/**
 * Spacing Design Tokens
 * Semantic spacing scale for consistent layouts
 */

export const SPACING_SCALE = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px  
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
} as const

// Semantic spacing for specific use cases
export const SEMANTIC_SPACING = {
  // Task card indentation levels
  TASK_INDENT: {
    LEVEL_1: '1.5rem',  // 24px
    LEVEL_2: '3rem',    // 48px  
    LEVEL_3: '4.5rem',  // 72px
    LEVEL_4: '6rem',    // 96px
  },
  
  // Section spacing
  SECTION: {
    PADDING: '1rem',     // 16px
    MARGIN: '1.5rem',    // 24px
    GAP: '0.75rem',      // 12px
  },
  
  // Card spacing
  CARD: {
    PADDING_SM: '0.75rem',  // 12px
    PADDING_MD: '1rem',     // 16px
    PADDING_LG: '1.5rem',   // 24px
    GAP: '0.5rem',          // 8px
  }
} as const

export type SpacingKey = keyof typeof SPACING_SCALE
export type SemanticSpacingKey = keyof typeof SEMANTIC_SPACING