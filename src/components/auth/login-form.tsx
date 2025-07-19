"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { API_ROUTES, ROUTES, VALIDATION, MESSAGES } from "@/lib/constants"
import { Loader2 } from "lucide-react"

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
      console.error('Login error:', error)
      setApiError(error instanceof Error ? error.message : MESSAGES.ERROR.GENERIC_ERROR)
    } finally {
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
          <CardDescription>
            Hesabınıza giriş yapmak için email adresinizi girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* API Hatası */}
              {apiError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                  {apiError}
                </div>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Şifre</Label>
                  <a
                    href={ROUTES.FORGOT_PASSWORD}
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Şifrenizi mi unuttunuz?
                  </a>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="Şifrenizi girin" 
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    'Giriş Yap'
                  )}
                </Button>
                <Button variant="outline" className="w-full" type="button" disabled={isSubmitting}>
                  Google ile Giriş Yap
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Hesabınız yok mu?{" "}
              <a href={ROUTES.REGISTER} className="underline underline-offset-4">
                Kayıt Ol
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
