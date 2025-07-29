"use client"

import { useClientTheme } from '@/hooks/use-client-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Client-side tema uygulaması
  useClientTheme()

  return <>{children}</>
}