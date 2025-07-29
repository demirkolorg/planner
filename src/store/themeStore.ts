import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS, THEME } from '@/lib/constants'

export type Theme = typeof THEME[keyof typeof THEME]

export type ColorTheme = 'default' | 'nature' | 'amber' | 'boldtech' | 'supabase' | 'quantum'

interface ThemeState {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  toggleTheme: () => void
  getSystemTheme: () => Theme
  getEffectiveTheme: () => Theme
  applyColorTheme: (colorTheme: ColorTheme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME.SYSTEM,
      colorTheme: 'default',
      
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

      setColorTheme: (colorTheme: ColorTheme) => {
        set({ colorTheme })
        get().applyColorTheme(colorTheme)
      },

      applyColorTheme: (colorTheme: ColorTheme) => {
        if (typeof window === 'undefined') return
        
        const root = document.documentElement
        const body = document.body
        
        // Mevcut tema sınıflarını hem root hem body'den temizle
        const themeClasses = ['theme-default', 'theme-nature', 'theme-amber', 'theme-boldtech', 'theme-supabase','theme-quantum']
        
        themeClasses.forEach(cls => {
          root.classList.remove(cls)
          body.classList.remove(cls)
        })
        
        // Yeni tema sınıfını hem root hem body'ye ekle
        const newThemeClass = `theme-${colorTheme}`
        root.classList.add(newThemeClass)
        body.classList.add(newThemeClass)
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
        colorTheme: state.colorTheme,
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
          
          // Renk temasını uygula
          state.applyColorTheme(state.colorTheme)
          
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