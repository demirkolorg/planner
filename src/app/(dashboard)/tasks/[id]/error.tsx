"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TaskDetailError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Task detail error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-destructive">
              Hata Oluştu
            </h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Görev Yüklenemedi
              </h2>
              <p className="text-muted-foreground">
                Görev detayları yüklenirken beklenmedik bir hata oluştu.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 justify-center">
                <Button onClick={reset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tekrar Dene
                </Button>
                <Link href="/">
                  <Button variant="outline">
                    Anasayfaya Dön
                  </Button>
                </Link>
              </div>
              
              {error.digest && (
                <p className="text-xs text-muted-foreground">
                  Hata Kodu: {error.digest}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}