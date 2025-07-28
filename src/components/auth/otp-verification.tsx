"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Mail, RefreshCw, CheckCircle } from "lucide-react"

interface OTPVerificationProps {
  email: string
  firstName?: string
  onVerified: () => void
  onResend?: () => void
  className?: string
}

export function OTPVerification({ 
  email, 
  firstName,
  onVerified, 
  onResend,
  className 
}: OTPVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 dakika = 600 saniye
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Geri sayım timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Zaman formatı
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Input değişiklik handler'ı
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Sadece rakam

    const newCode = [...code]
    newCode[index] = value.slice(-1) // Son karakteri al
    setCode(newCode)
    setError('')

    // Sonraki input'a odaklan
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Tüm alanlar doluysa otomatik doğrula
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''))
    }
  }

  // Backspace handler
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = paste.split('').concat(Array(6 - paste.length).fill(''))
    setCode(newCode)
    
    if (paste.length === 6) {
      handleVerify(paste)
    }
  }

  // OTP doğrulama
  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('')
    
    if (verificationCode.length !== 6) {
      setError('Lütfen 6 haneli kodu tam olarak girin')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Doğrulama başarısız')
      }

      onVerified()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
      // Hata durumunda kodu temizle
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  // Kodu yeniden gönder
  const handleResend = async () => {
    if (!canResend || isResending) return

    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Kod gönderilemedi')
      }

      // Timer'ı resetle
      setTimeLeft(600)
      setCanResend(false)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      
      if (onResend) {
        onResend()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kod gönderilemedi')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Email Doğrulama</h2>
        <p className="text-muted-foreground">
          <span className="font-medium">{email}</span> adresine gönderilen 6 haneli kodu girin
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className={cn(
                "w-12 h-14 text-center text-xl font-bold border-2 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                "transition-all duration-200",
                digit ? "border-primary bg-primary/5" : "border-border",
                error ? "border-red-500 bg-red-50/50" : ""
              )}
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center">
            <div className="text-sm text-red-600 flex items-center justify-center space-x-1">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {timeLeft > 0 ? (
              <>Kod {formatTime(timeLeft)} sonra geçersiz olacak</>
            ) : (
              <span className="text-red-600">Kodun süresi doldu</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => handleVerify()}
          disabled={code.some(digit => !digit) || isVerifying}
          className="w-full h-12 text-base font-medium"
        >
          {isVerifying ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Doğrulanıyor...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Doğrula</span>
            </div>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleResend}
          disabled={!canResend || isResending}
          className="w-full h-12 text-base font-medium"
        >
          {isResending ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gönderiliyor...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Kodu Yeniden Gönder</span>
            </div>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Kodu alamadınız mı? Spam/gereksiz klasörünüzü kontrol edin.
        </p>
      </div>
    </div>
  )
}