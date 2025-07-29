"use client"

import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function useClientTheme() {
  const { colorTheme, applyColorTheme } = useThemeStore()

  useEffect(() => {
    // Client-side'da hydration tamamlandıktan sonra tema uygula
    if (typeof window !== 'undefined') {
      applyColorTheme(colorTheme)
    }
  }, [colorTheme, applyColorTheme])

  return { colorTheme }
}