"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { API_ROUTES, ROUTES, VALIDATION, MESSAGES } from "@/lib/constants"
import { Loader2, Mail, Lock, Eye, EyeOff, Chrome } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.email) {
      newErrors.email = MESSAGES.ERROR.REQUIRED_FIELDS
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = MESSAGES.ERROR.INVALID_EMAIL
    }

    if (!formData.password) {
      newErrors.password = MESSAGES.ERROR.REQUIRED_FIELDS
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = MESSAGES.ERROR.PASSWORD_TOO_SHORT
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setApiError('')
    
    try {
      const response = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || MESSAGES.ERROR.GENERIC_ERROR)
      }

      // Başarılı giriş - kullanıcı bilgilerini Zustand store'a kaydet ve ana sayfaya yönlendir
      login(data.user)
      router.push(ROUTES.HOME)
      setIsSubmitting(false)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : MESSAGES.ERROR.GENERIC_ERROR)
    } finally {
    }
  }

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Hatası */}
        {apiError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          </div>
        )}
        
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Adresi
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={handleInputChange}
              className={cn(
                "pl-10 h-12 transition-all duration-200",
                errors.email 
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-900/10' 
                  : 'focus-visible:ring-primary/20 focus-visible:border-primary'
              )}
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center space-x-1">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Şifre
            </Label>
            <a
              href={ROUTES.FORGOT_PASSWORD}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Şifremi Unuttum
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="password" 
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleInputChange}
              className={cn(
                "pl-10 pr-10 h-12 transition-all duration-200",
                errors.password 
                  ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-900/10' 
                  : 'focus-visible:ring-primary/20 focus-visible:border-primary'
              )}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 flex items-center space-x-1">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Giriş Yapılıyor...</span>
              </div>
            ) : (
              'Giriş Yap'
            )}
          </Button>
          
{/* TODO: Google OAuth entegrasyonu yapılacak */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">veya</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base font-medium border-2 transition-all duration-200 hover:bg-accent hover:shadow-md" 
            type="button" 
            disabled={isSubmitting}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google ile Giriş Yap
          </Button> */}
        </div>
      </form>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Hesabınız yok mu?{" "}
          <a 
            href={ROUTES.REGISTER} 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Kayıt Ol
          </a>
        </p>
      </div>
    </div>
  )
}
