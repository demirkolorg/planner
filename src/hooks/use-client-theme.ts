"use client"

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function useClientTheme() {
  const { theme, colorTheme, setTheme, applyColorTheme, getEffectiveTheme } = useThemeStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Client-side hydration tamamlanmasını bekle
    setIsHydrated(true)
    
    if (typeof window !== 'undefined') {
      // Hem dark/light tema hem de renk temasını uygula
      const effectiveTheme = getEffectiveTheme()
      
      // HTML elementine tema sınıflarını ekle
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(effectiveTheme)
      root.setAttribute('data-theme', effectiveTheme)
      root.style.colorScheme = effectiveTheme
      
      // Renk temasını uygula
      applyColorTheme(colorTheme)
    }
  }, [theme, colorTheme, applyColorTheme, getEffectiveTheme])

  return { 
    theme, 
    colorTheme, 
    isHydrated,
    setTheme,
    effectiveTheme: isHydrated ? getEffectiveTheme() : 'light' 
  }
}