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

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Form state'lerini yönetir
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    rePassword: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();
  
  // Form alanlarını günceller
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = MESSAGES.ERROR.REQUIRED_FIELDS;
    } else if (formData.firstName.trim().length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.firstName = `Ad en az ${VALIDATION.NAME_MIN_LENGTH} karakter olmalıdır`;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = MESSAGES.ERROR.REQUIRED_FIELDS;
    } else if (formData.lastName.trim().length < VALIDATION.NAME_MIN_LENGTH) {
      newErrors.lastName = `Soyad en az ${VALIDATION.NAME_MIN_LENGTH} karakter olmalıdır`;
    }

    if (!formData.email) {
      newErrors.email = MESSAGES.ERROR.REQUIRED_FIELDS;
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = MESSAGES.ERROR.INVALID_EMAIL;
    }

    if (!formData.password) {
      newErrors.password = MESSAGES.ERROR.REQUIRED_FIELDS;
    } else if (formData.password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = MESSAGES.ERROR.PASSWORD_TOO_SHORT;
    }

    if (!formData.rePassword) {
      newErrors.rePassword = MESSAGES.ERROR.REQUIRED_FIELDS;
    } else if (formData.password !== formData.rePassword) {
      newErrors.rePassword = MESSAGES.ERROR.PASSWORDS_NOT_MATCH;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form gönderim işlemini yönetir
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    
    try {
      const response = await fetch(API_ROUTES.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || MESSAGES.ERROR.GENERIC_ERROR);
      }

      // Başarılı kayıt - kullanıcıyı otomatik login yap ve ana sayfaya yönlendir
      login(data.user);
      router.push(ROUTES.HOME);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : MESSAGES.ERROR.GENERIC_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Hesap Oluştur</CardTitle>
          <CardDescription>
            Yeni hesap oluşturmak için aşağıdaki bilgileri doldurun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Ad Soyad Alanları */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Adınız"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Soyadınız"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    required
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              {/* Email Alanı */}
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
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              {/* Şifre Alanları */}
              <div className="grid gap-3">
                <Label htmlFor="password">Şifre</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  placeholder="Şifrenizi girin"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required 
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="rePassword">Şifre Tekrar</Label>
                <Input 
                  id="rePassword" 
                  name="rePassword"
                  type="password" 
                  placeholder="Şifrenizi tekrar girin"
                  value={formData.rePassword}
                  onChange={handleInputChange}
                  className={errors.rePassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required 
                />
                {errors.rePassword && (
                  <p className="text-sm text-red-500">{errors.rePassword}</p>
                )}
              </div>
              
              {/* API Hatası */}
              {apiError && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                  {apiError}
                </div>
              )}
              
              {/* Kayıt Butonu */}
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                </Button>
                <Button variant="outline" className="w-full" type="button" disabled={isSubmitting}>
                  Google ile Kayıt Ol
                </Button>
              </div>
            </div>
            
            {/* Giriş Linki */}
            <div className="mt-4 text-center text-sm">
              Zaten hesabınız var mı?{" "}
              <a href={ROUTES.LOGIN} className="underline underline-offset-4">
                Giriş Yap
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
