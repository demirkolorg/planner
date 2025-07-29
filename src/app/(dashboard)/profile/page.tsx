"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Mail, User, UserCheck, Clock, Activity, Shield, Key, Eye, EyeOff, CheckCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { OTPVerification } from "@/components/auth/otp-verification"
import Link from "next/link"

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [activeTab, setActiveTab] = useState("profile")
  
  // Profil bilgileri düzenleme state'leri
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  
  // Email düzenleme state'leri
  const [emailStep, setEmailStep] = useState<'form' | 'otp'>('form')
  const [newEmail, setNewEmail] = useState("")
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Parola düzenleme state'leri
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { tasks } = useTaskStore()
  const { projects } = useProjectStore()

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setNewEmail(user.email)
    }
  }, [user])

  const handleProfileSave = async () => {
    setIsProfileLoading(true)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateProfile(updatedUser)
        setIsEditingProfile(false)
        setSuccessMessage('Profil bilgileriniz başarıyla güncellendi!')
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        console.error('Profile update failed:', errorData)
        alert(`Profil güncelleme başarısız: ${errorData.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleProfileCancel = () => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
    }
    setIsEditingProfile(false)
  }

  const handleEmailSendOTP = async () => {
    if (!newEmail.trim()) return

    setIsEmailLoading(true)
    try {
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      })

      if (response.ok) {
        setEmailStep('otp')
      } else {
        const errorData = await response.json()
        console.error('Failed to send OTP:', errorData)
        alert(`OTP gönderilirken hata: ${errorData.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert('OTP gönderilirken hata oluştu')
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handleEmailOTPVerified = async () => {
    // OTP doğrulandı, güncel user bilgilerini çek
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const updatedUser = await response.json()
        updateProfile(updatedUser)
        setEmailStep('form')
        setSuccessMessage('Email adresiniz başarıyla güncellendi!')
        setShowSuccessModal(true)
      } else {
        throw new Error('Profile güncellenemedi')
      }
    } catch (error) {
      console.error('Error updating email:', error)
      alert('Email güncellenirken hata oluştu')
    }
  }

  const handleEmailCancel = () => {
    if (user) {
      setNewEmail(user.email)
    }
    setEmailStep('form')
  }

  const handlePasswordSave = async () => {
    if (newPassword !== confirmPassword) {
      console.error('Passwords do not match')
      return
    }

    setIsPasswordLoading(true)
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      })

      if (response.ok) {
        setIsEditingPassword(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setSuccessMessage('Parolanız başarıyla güncellendi!')
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        console.error('Password update failed:', errorData)
        alert(`Parola güncelleme başarısız: ${errorData.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Error updating password:', error)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handlePasswordCancel = () => {
    setIsEditingPassword(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  // İstatistikler hesapla
  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const totalProjects = projects.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Güvenli tarih kontrolü fonksiyonu
  const isValidDate = (dateString: string | undefined | null) => {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  // Bugün tamamlanan görevler
  const today = new Date()
  const todayStr = today.getFullYear() + '-' + 
                  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(today.getDate()).padStart(2, '0')

  const todayCompletedTasks = tasks.filter(task => {
    if (!task.completed || !isValidDate(task.updatedAt)) return false
    const taskUpdatedDate = new Date(task.updatedAt)
    const taskDateStr = taskUpdatedDate.getFullYear() + '-' + 
                       String(taskUpdatedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(taskUpdatedDate.getDate()).padStart(2, '0')
    return taskDateStr === todayStr
  }).length

  // Son tamamlanan görevler (en son 5)
  const recentCompletedTasks = tasks
    .filter(task => task.completed && isValidDate(task.updatedAt))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Profil
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hesap bilgilerinizi ve istatistiklerinizi yönetin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil Bilgileri
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Güvenlik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">

            {/* Profil Kartı */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className="text-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{user.firstName} {user.lastName}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </CardDescription>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Üye olma: {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: tr }) : 'Bilinmiyor'}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Bilgi Düzenleme */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                    <CardDescription>Ad ve soyad bilgilerinizi düzenleyin</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Ad</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Soyad</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>
                
                {isEditingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleProfileSave} disabled={isProfileLoading}>
                      {isProfileLoading ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                    <Button variant="outline" onClick={handleProfileCancel} disabled={isProfileLoading}>
                      İptal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* İstatistikler */}
            <div className="space-y-6">
            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Proje</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProjects}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Görev</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    %{completionRate} tamamlanma oranı
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bugün Tamamlanan</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayCompletedTasks}</div>
                </CardContent>
              </Card>
            </div>

            {/* Son Tamamlanan Görevler */}
            <Card>
              <CardHeader>
                <CardTitle>Son Tamamlanan Görevler</CardTitle>
                <CardDescription>En son tamamladığınız görevler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCompletedTasks.length > 0 ? (
                    recentCompletedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {task.project && (
                              <Badge variant="secondary">
                                {task.project.emoji} {task.project.name}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.updatedAt ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: tr }) : 'Bilinmiyor'}
                            </span>
                          </div>
                        </div>
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Henüz tamamlanmış görev bulunmuyor</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Email Güvenliği */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Adresi</CardTitle>
                    <CardDescription>Hesabınızın email adresini güncelleyin</CardDescription>
                  </div>
                  {emailStep === 'form' && (
                    <Button onClick={() => setEmailStep('form')} variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailStep === 'form' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Mevcut Email</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">
                        {user?.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">Yeni Email Adresi</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Yeni email adresinizi girin"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleEmailSendOTP} 
                        disabled={isEmailLoading || !newEmail.trim() || newEmail === user?.email}
                      >
                        {isEmailLoading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
                      </Button>
                      <Button variant="outline" onClick={handleEmailCancel} disabled={isEmailLoading}>
                        İptal
                      </Button>
                    </div>
                  </>
                ) : (
                  <OTPVerification
                    email={newEmail}
                    firstName={user?.firstName}
                    onVerified={handleEmailOTPVerified}
                    onResend={() => {
                      // Profile sayfası için resend işlemi
                      handleEmailSendOTP()
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Parola Güvenliği */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parola</CardTitle>
                    <CardDescription>Hesabınızın parolasını güncelleyin</CardDescription>
                  </div>
                  {!isEditingPassword && (
                    <Button onClick={() => setIsEditingPassword(true)} variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Düzenle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditingPassword ? (
                  <div className="space-y-2">
                    <Label>Parola</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm">
                      ••••••••••••
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mevcut Parola</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Yeni Parola</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Yeni Parola Tekrarı</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-destructive">
                        Parolalar eşleşmiyor
                      </p>
                    )}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handlePasswordSave} 
                        disabled={isPasswordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      >
                        {isPasswordLoading ? "Kaydediliyor..." : "Parolayı Güncelle"}
                      </Button>
                      <Button variant="outline" onClick={handlePasswordCancel} disabled={isPasswordLoading}>
                        İptal
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center text-xl font-semibold">
                Başarılı!
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                {successMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-6">
              <Button onClick={() => setShowSuccessModal(false)} className="px-8">
                Tamam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}