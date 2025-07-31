"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

interface SplashScreenProps {
  className?: string
  message?: string
}

export function SplashScreen({ className, message = "Yükleniyor..." }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Fade-in efekti için kısa bir gecikme
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5",
      "transition-opacity duration-500",
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}>
      <div className="text-center space-y-8 px-4">
        {/* Logo/Brand */}
        <div className="relative flex flex-col items-center">
          <div className="flex items-center space-x-4 mb-2">
            <Logo size={80} className="md:w-20 md:h-20" />
            <h1 className={cn(
              "text-6xl md:text-7xl font-bold",
              "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent",
              "splash-logo"
            )}>
              Planner
            </h1>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-ping opacity-75" />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-secondary rounded-full animate-ping opacity-50 animation-delay-300" />
        </div>

        {/* Loading Animation */}
        <div className="flex flex-col items-center space-y-4">
          {/* Modern Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground animate-pulse">
            {message}
          </p>
          <p className="text-sm text-muted-foreground/70">
            Verimlilik yolculuğunuz başlıyor...
          </p>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full splash-float animation-delay-700"></div>
          <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-secondary/40 rounded-full splash-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/20 rounded-full splash-float animation-delay-500"></div>
        </div>
      </div>
    </div>
  )
}