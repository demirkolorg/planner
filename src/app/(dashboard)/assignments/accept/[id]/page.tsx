"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Mail, User, FolderKanban, List, CheckSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface EmailAssignment {
  id: string
  email: string
  targetType: 'PROJECT' | 'SECTION' | 'TASK'
  targetId: string
  role: string
  assignedBy: string
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  message?: string
  expiresAt?: string
  assignedAt: string
  assigner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function AssignmentAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const assignmentId = params.id as string
  
  const [assignment, setAssignment] = useState<EmailAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment()
    }
  }, [assignmentId])

  const fetchAssignment = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/assignments/email/${assignmentId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Bu atama bulunamadı veya süresi dolmuş olabilir.')
        } else {
          setError('Atama bilgileri alınırken hata oluştu.')
        }
        return
      }

      const data = await response.json()
      setAssignment(data.assignment)
    } catch (error) {
      console.error('Assignment fetch error:', error)
      setError('Atama bilgileri alınırken hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!assignment) return

    // Kullanıcı giriş yapmış mı kontrol et
    try {
      const profileResponse = await fetch('/api/auth/profile')
      if (!profileResponse.ok) {
        // Kullanıcı giriş yapmamış - kayıt sayfasına yönlendir
        toast.info('Bu davetiyeyi kabul etmek için önce hesap oluşturmanız gerekiyor.')
        router.push(`/register?email=${encodeURIComponent(assignment.email)}&redirect=${encodeURIComponent(window.location.href)}`)
        return
      }

      const profile = await profileResponse.json()
      
      // Email adresi eşleşiyor mu kontrol et
      if (profile.email !== assignment.email) {
        toast.error('Bu davetiye başka bir email adresi için gönderilmiş. Lütfen doğru hesapla giriş yapın.')
        return
      }

      // Atamayı kabul et
      setIsProcessing(true)
      const acceptResponse = await fetch(`/api/assignments/email/${assignmentId}/accept`, {
        method: 'POST'
      })

      if (!acceptResponse.ok) {
        const errorData = await acceptResponse.json()
        throw new Error(errorData.error || 'Atama kabul edilirken hata oluştu')
      }

      toast.success('Atama başarıyla kabul edildi!')
      
      // Projeye yönlendir
      if (assignment.targetType === 'PROJECT') {
        router.push(`/projects/${assignment.targetId}`)
      } else {
        // Section veya Task için proje sayfasına yönlendir
        // API'den proje ID'sini almak gerekebilir
        router.push('/projects')
      }

    } catch (error) {
      console.error('Accept error:', error)
      toast.error(error instanceof Error ? error.message : 'Atama kabul edilirken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!assignment) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/assignments/email/${assignmentId}/accept`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Atama reddedilirken hata oluştu')
      }

      toast.success('Atama reddedildi.')
      router.push('/')

    } catch (error) {
      console.error('Reject error:', error)
      toast.error(error instanceof Error ? error.message : 'Atama reddedilirken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  // Get target icon and label
  const getTargetInfo = () => {
    if (!assignment) return { icon: null, label: '' }
    
    switch (assignment.targetType) {
      case 'PROJECT':
        return { icon: <FolderKanban className="h-5 w-5" />, label: 'Proje' }
      case 'SECTION':
        return { icon: <List className="h-5 w-5" />, label: 'Bölüm' }
      case 'TASK':
        return { icon: <CheckSquare className="h-5 w-5" />, label: 'Görev' }
      default:
        return { icon: null, label: '' }
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'COLLABORATOR': return 'İş Ortağı'
      case 'VIEWER': return 'İzleyici'
      case 'OWNER': return 'Sorumlu'
      case 'MEMBER': return 'Üye'
      default: return role
    }
  }

  const isExpired = assignment?.expiresAt && new Date(assignment.expiresAt) < new Date()
  const targetInfo = getTargetInfo()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Davetiye yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-destructive">Davetiye Bulunamadı</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || 'Bu davetiye geçersiz veya süresi dolmuş olabilir.'}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (assignment.status === 'EXPIRED' || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Davetiye Süresi Doldu</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu davetiyenin süresi dolmuş. Yeni bir davetiye için proje yöneticisiyle iletişime geçin.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (assignment.status === 'CANCELLED') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Davetiye İptal Edildi</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu davetiye iptal edilmiş.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (assignment.status === 'ACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-green-700">Davetiye Zaten Kabul Edildi</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Bu davetiyeyi zaten kabul etmişsiniz.
            </p>
            <Button onClick={() => router.push('/projects')} variant="outline">
              Projeler Sayfasına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              {targetInfo.icon}
            </div>
            <CardTitle className="text-2xl">Atama Davetiyesi</CardTitle>
            <p className="text-muted-foreground">
              {assignment.assigner.firstName} {assignment.assigner.lastName} sizi bir {targetInfo.label.toLowerCase()}'ye davet etti
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Assignment Details */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{targetInfo.label}:</span>
                <span className="font-medium">Loading...</span> {/* TODO: Get target name */}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Rol:</span>
                <Badge variant="secondary">{getRoleLabel(assignment.role)}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Davet Eden:</span>
                <div className="text-right">
                  <div className="font-medium">
                    {assignment.assigner.firstName} {assignment.assigner.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {assignment.assigner.email}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Email:</span>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="h-3 w-3" />
                  {assignment.email}
                </div>
              </div>
            </div>

            {/* Personal Message */}
            {assignment.message && (
              <div className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-medium mb-1">Kişisel Mesaj:</h4>
                <p className="text-sm text-muted-foreground italic">
                  "{assignment.message}"
                </p>
              </div>
            )}

            {/* Expiry Warning */}
            {assignment.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Bu davetiye {new Date(assignment.expiresAt).toLocaleDateString('tr-TR')} tarihinde sona erecek.
                </span>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={handleAccept} 
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? 'İşleniyor...' : 'Davetiyeyi Kabul Et'}
              </Button>
              
              <Button 
                onClick={handleReject} 
                disabled={isProcessing}
                variant="outline"
                size="lg"
              >
                Reddet
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>
                Bu davetiyeyi kabul etmek için <strong>{assignment.email}</strong> adresiyle 
                kayıtlı bir hesabınız olmalıdır. Hesabınız yoksa kayıt sayfasına yönlendirileceksiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}