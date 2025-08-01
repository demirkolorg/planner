import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FontSizeState {
  fontSize: number
  setFontSize: (size: number) => void
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void
}

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 20
const DEFAULT_FONT_SIZE = 16

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontSize: DEFAULT_FONT_SIZE,
      
      setFontSize: (size: number) => {
        const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size))
        set({ fontSize: clampedSize })
        // Sadece html element'in font-size'ını güncelle (rem base)
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = `${clampedSize}px`
          document.documentElement.style.setProperty('--font-size-base', `${clampedSize}px`)
        }
      },
      
      increaseFontSize: () => {
        const currentSize = get().fontSize
        const newSize = Math.min(MAX_FONT_SIZE, currentSize + 1)
        get().setFontSize(newSize)
      },
      
      decreaseFontSize: () => {
        const currentSize = get().fontSize
        const newSize = Math.max(MIN_FONT_SIZE, currentSize - 1)
        get().setFontSize(newSize)
      },
      
      resetFontSize: () => {
        get().setFontSize(DEFAULT_FONT_SIZE)
      }
    }),
    {
      name: 'planner-font-size-storage',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          // Sayfa yüklendiğinde font size'ı uygula
          document.documentElement.style.fontSize = `${state.fontSize}px`
          document.documentElement.style.setProperty('--font-size-base', `${state.fontSize}px`)
        }
      }
    }
  )
)