'use client'

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Logo } from "@/components/ui/logo";
import { BRAND_SLOGANS } from "@/lib/constants";

export default function LoginPage() {
  const [randomSlogan, setRandomSlogan] = useState("Hedefe Tık Tık.")
  
  useEffect(() => {
    // Client-side'da rastgele slogan seç (hydration sorunu için)
    const randomIndex = Math.floor(Math.random() * BRAND_SLOGANS.length)
    setRandomSlogan(BRAND_SLOGANS[randomIndex])
  }, [])
  
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Sol Panel - Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        {/* Dekoratif arka plan */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary/15 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center space-y-6 px-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <Logo size={32} />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Planner</h1>
          </div>
          
          <div className="space-y-4 max-w-md">
            <h2 className="text-2xl font-semibold text-foreground/90">
              {randomSlogan}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              En büyük projeler, en sağlam ağaç gövdeleri gibidir. Planner ile her projeyi yönetilebilir "tık"lara bölün ve hedefinize odaklanarak başarıya ulaşın.
            </p>
            <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground italic">
                "Ağaçkakan gibi kararlı ve odaklı olun. Her tık, hedefe bir adım daha yakın."
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            <div className="text-center p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Kullanıcı</div>
            </div>
            <div className="text-center p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Proje</div>
            </div>
            <div className="text-center p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-bold text-primary">99%</div>
              <div className="text-sm text-muted-foreground">Memnuniyet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Login Form */}
      <div className="flex items-center justify-center p-6 md:p-8 lg:p-12 relative">
        {/* Mode Toggle */}
        <div className="absolute top-4 right-4 lg:top-8 lg:right-8">
          <ModeToggle />
        </div>
        
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center space-x-2">
          <Logo size={24} />
          <span className="text-xl font-bold">Planner</span>
        </div>
        
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">Hoş Geldiniz</h1>
            <p className="text-muted-foreground mt-2">
              Hesabınıza giriş yaparak devam edin
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
