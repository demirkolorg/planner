"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { API_ROUTES, ROUTES, VALIDATION, MESSAGES } from "@/lib/constants"
import { Loader2, Mail, Lock, Eye, EyeOff, Chrome, User } from "lucide-react"
import { OTPVerification } from "@/components/auth/otp-verification"

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
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const router = useRouter();
  
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

  // OTP gönderme işlemini yönetir
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSendingOTP(true);
    setApiError('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP gönderilemedi');
      }

      // OTP gönderildi, doğrulama adımına geç
      setStep('otp');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'OTP gönderilemedi');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // OTP doğrulandıktan sonra kayıt işlemini tamamla
  const handleOTPVerified = async () => {
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

      // Başarılı kayıt - login sayfasına yönlendir
      router.push(ROUTES.LOGIN);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : MESSAGES.ERROR.GENERIC_ERROR);
      // Hata durumunda form adımına geri dön
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // OTP adımında geri dön
  const handleBackToForm = () => {
    setStep('form');
    setApiError('');
  };
  
  // OTP yeniden gönder
  const handleResendOTP = async () => {
    setIsSendingOTP(true);
    setApiError('');
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP gönderilemedi');
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'OTP gönderilemedi');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // OTP adımındaysa OTP bileşenini göster
  if (step === 'otp') {
    return (
      <div className={cn("space-y-6", className)} {...props}>
        {/* API Hatası */}
        {apiError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          </div>
        )}

        <OTPVerification
          email={formData.email}
          firstName={formData.firstName}
          onVerified={handleOTPVerified}
          onResend={handleResendOTP}
        />

        {/* Geri dön butonu */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleBackToForm}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Forma Geri Dön
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <form onSubmit={handleSendOTP} className="space-y-6">
        {/* API Hatası */}
        {apiError && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          </div>
        )}
        
        {/* Ad Soyad Alanları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              Ad
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Adınız"
                value={formData.firstName}
                onChange={handleInputChange}
                className={cn(
                  "pl-10 h-12 transition-all duration-200",
                  errors.firstName 
                    ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-900/10' 
                    : 'focus-visible:ring-primary/20 focus-visible:border-primary'
                )}
                disabled={isSendingOTP}
                required
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Soyad
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Soyadınız"
                value={formData.lastName}
                onChange={handleInputChange}
                className={cn(
                  "pl-10 h-12 transition-all duration-200",
                  errors.lastName 
                    ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-900/10' 
                    : 'focus-visible:ring-primary/20 focus-visible:border-primary'
                )}
                disabled={isSendingOTP}
                required
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <span>{errors.lastName}</span>
              </p>
            )}
          </div>
        </div>

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
              required
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center space-x-1">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Şifre
            </Label>
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
                disabled={isSendingOTP}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSendingOTP}
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

          <div className="space-y-2">
            <Label htmlFor="rePassword" className="text-sm font-medium">
              Şifre Tekrar
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="rePassword" 
                name="rePassword"
                type={showRePassword ? "text" : "password"}
                placeholder="••••••••" 
                value={formData.rePassword}
                onChange={handleInputChange}
                className={cn(
                  "pl-10 pr-10 h-12 transition-all duration-200",
                  errors.rePassword 
                    ? 'border-red-500 focus-visible:ring-red-500 bg-red-50/50 dark:bg-red-900/10' 
                    : 'focus-visible:ring-primary/20 focus-visible:border-primary'
                )}
                disabled={isSendingOTP}
                required
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSendingOTP}
              >
                {showRePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.rePassword && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                <span>{errors.rePassword}</span>
              </p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25" 
            disabled={isSendingOTP}
          >
            {isSendingOTP ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Doğrulama Kodu Gönderiliyor...</span>
              </div>
            ) : (
              'Email Doğrulama Kodu Gönder'
            )}
          </Button>
          
          <div className="relative">
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
            disabled={isSendingOTP}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Google ile Kayıt Ol
          </Button>
        </div>
      </form>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm">
          Zaten hesabınız var mı?{" "}
          <a 
            href={ROUTES.LOGIN} 
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Giriş Yap
          </a>
        </p>
      </div>
    </div>
  )
}
