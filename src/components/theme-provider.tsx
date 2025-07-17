"use client"

import * as React from "react"
import { useThemeStore } from "@/store/themeStore"
import { THEME } from "@/lib/constants"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, getSystemTheme } = useThemeStore()
  
  React.useEffect(() => {
    // İlk yüklemede tema uygula
    const root = document.documentElement
    const effectiveTheme = theme === THEME.SYSTEM ? getSystemTheme() : theme
    
    root.classList.remove(THEME.LIGHT, THEME.DARK)
    root.classList.add(effectiveTheme)
    root.setAttribute('data-theme', effectiveTheme)
    root.style.colorScheme = effectiveTheme
    
    // System tema değişikliklerini dinle
    if (theme === THEME.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (useThemeStore.getState().theme === THEME.SYSTEM) {
          setTheme(THEME.SYSTEM) // Yeniden uygula
        }
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, setTheme, getSystemTheme])
  
  return <>{children}</>
}