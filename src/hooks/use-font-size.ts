"use client"

import { useEffect } from 'react'
import { useFontSizeStore } from '@/store/fontSizeStore'

export function useFontSize() {
  const { fontSize, setFontSize } = useFontSizeStore()

  useEffect(() => {
    // Sayfa yüklendiğinde font size'ı uygula
    document.documentElement.style.fontSize = `${fontSize}px`
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`)
  }, [fontSize])

  return {
    fontSize,
    setFontSize
  }
}