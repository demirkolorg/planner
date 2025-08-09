'use client'

import { useState, useEffect, Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Users, Shield, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { BRAND_SLOGANS } from "@/lib/constants";

function RegisterContent() {
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
              Projenizin dijital ağaçkakanı olun. Büyük hedefleri küçük, yönetilebilir "tık"lara bölün ve kararlı vuruşlarla başarıya ulaşın.
            </p>
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground font-medium">
                "En büyük başarılar, kararlı vuruşların eseridir."
              </p>
            </div>
          </div>
          
          <div className="space-y-4 max-w-md">
            <div className="flex items-center space-x-3 p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <Users className="h-6 w-6 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-sm">Ritmik İş Akışı</h3>
                <p className="text-xs text-muted-foreground">Her tık, hedefe bir adım daha yakın</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <Shield className="h-6 w-6 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-sm">Odaklanmış Yaklaşım</h3>
                <p className="text-xs text-muted-foreground">Dağınıklığı değil, hedefi yönetin</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg backdrop-blur-sm">
              <Zap className="h-6 w-6 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-sm">Net Vuruşlar</h3>
                <p className="text-xs text-muted-foreground">Büyük projeler, küçük adımlarla</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Register Form */}
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
            <h1 className="text-3xl font-bold tracking-tight">Hesap Oluşturun</h1>
            <p className="text-muted-foreground mt-2">
              Ücretsiz hesabınızı oluşturun ve hemen başlayın
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
