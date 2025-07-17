import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, THEME } from '@/lib/constants'

export type Theme = typeof THEME[keyof typeof THEME]

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  getSystemTheme: () => Theme
  getEffectiveTheme: () => Theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME.SYSTEM,
      
      setTheme: (theme: Theme) => {
        set({ theme })
        
        // DOM manipülasyonu
        const root = document.documentElement
        const effectiveTheme = theme === THEME.SYSTEM ? get().getSystemTheme() : theme
        
        root.classList.remove(THEME.LIGHT, THEME.DARK)
        root.classList.add(effectiveTheme)
        
        // next-themes uyumluluğu için
        root.setAttribute('data-theme', effectiveTheme)
        root.style.colorScheme = effectiveTheme
      },
      
      toggleTheme: () => {
        const current = get().getEffectiveTheme()
        const newTheme = current === THEME.LIGHT ? THEME.DARK : THEME.LIGHT
        get().setTheme(newTheme)
      },
      
      getSystemTheme: (): Theme => {
        if (typeof window === 'undefined') return THEME.LIGHT
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME.DARK : THEME.LIGHT
      },
      
      getEffectiveTheme: (): Theme => {
        const { theme } = get()
        return theme === THEME.SYSTEM ? get().getSystemTheme() : theme
      },
    }),
    {
      name: STORAGE_KEYS.THEME_STORAGE,
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          // Sayfa yüklendiğinde tema uygula
          const root = document.documentElement
          const effectiveTheme = state.theme === THEME.SYSTEM ? state.getSystemTheme() : state.theme
          
          root.classList.remove(THEME.LIGHT, THEME.DARK)
          root.classList.add(effectiveTheme)
          root.setAttribute('data-theme', effectiveTheme)
          root.style.colorScheme = effectiveTheme
          
          // System tema değişikliklerini dinle
          if (state.theme === THEME.SYSTEM) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handleChange = () => {
              if (state.theme === THEME.SYSTEM) {
                state.setTheme(THEME.SYSTEM) // Yeniden uygula
              }
            }
            mediaQuery.addEventListener('change', handleChange)
          }
        }
      },
    }
  )
)