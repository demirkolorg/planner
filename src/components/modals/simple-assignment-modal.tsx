"use client"

import React, { useState, useEffect } from 'react'
import { X, User, Mail, Clock, UserX, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPicker } from '@/components/ui/user-picker'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface AssignedUser {
  id: string
  userId?: string
  email?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assigner: {
    firstName: string
    lastName: string
  }
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
  assignedAt: string
  expiresAt?: string
}

interface SimpleAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'PROJECT' | 'SECTION' | 'TASK'
  targetId: string
  targetName: string
  onSuccess?: () => void
}

export function SimpleAssignmentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  onSuccess
}: SimpleAssignmentModalProps) {
  const [assignments, setAssignments] = useState<AssignedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [message, setMessage] = useState('')

  // Atamaları yükle
  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/assignments?targetType=${targetType}&targetId=${targetId}`)
      
      if (response.ok) {
        const data = await response.json()
        const allAssignments = [...(data.activeUsers || []), ...(data.pendingEmails || [])]
        setAssignments(allAssignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Atamalar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Modal açıldığında atamaları yükle
  useEffect(() => {
    if (isOpen) {
      fetchAssignments()
    }
  }, [isOpen, targetType, targetId])

  // Email ekleme
  const addEmail = () => {
    const trimmedEmail = emailInput.trim()
    
    if (!trimmedEmail) return
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Geçersiz email formatı')
      return
    }

    if (emails.includes(trimmedEmail)) {
      toast.error('Bu email zaten eklendi')
      return
    }

    setEmails([...emails, trimmedEmail])
    setEmailInput('')
  }

  // Email kaldırma
  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove))
  }

  // Atama oluştur
  const handleAssign = async () => {
    if (selectedUserIds.length === 0 && emails.length === 0) {
      toast.error('En az bir kullanıcı veya email seçmelisiniz')
      return
    }

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          emails: emails.length > 0 ? emails : undefined,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Başarı mesajları
        if (data.userAssignments?.length > 0) {
          toast.success(`${data.userAssignments.length} kullanıcı atandı`)
        }
        if (data.emailAssignments?.length > 0) {
          toast.success(`${data.emailAssignments.length} email davetiyesi gönderildi`)
        }
        
        // Hata mesajları
        if (data.errors?.length > 0) {
          data.errors.forEach((error: string) => {
            toast.error(error)
          })
        }

        // Formu temizle
        setSelectedUserIds([])
        setEmails([])
        setMessage('')
        
        // Atamaları yeniden yükle
        await fetchAssignments()
        
        // Parent'e bildir
        onSuccess?.()
        
      } else {
        toast.error(data.error || 'Atama oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Assignment error:', error)
      toast.error('Atama oluşturulurken hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Atama sil
  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Atama kaldırıldı')
        await fetchAssignments()
        onSuccess?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Atama kaldırılırken hata oluştu')
      }
    } catch (error) {
      console.error('Remove assignment error:', error)
      toast.error('Atama kaldırılırken hata oluştu')
    }
  }

  const typeLabel = targetType === 'PROJECT' ? 'Proje' : 
                   targetType === 'SECTION' ? 'Bölüm' : 'Görev'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {typeLabel} Atamaları - {targetName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mevcut Atamalar */}
          <div>
            <h3 className="text-sm font-medium mb-3">Atanmış Kullanıcılar</h3>
            
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded-md animate-pulse" />
                <div className="h-10 bg-muted rounded-md animate-pulse" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Henüz kimse atanmamış
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {assignment.status === 'ACTIVE' && assignment.user
                            ? `${assignment.user.firstName[0]}${assignment.user.lastName[0]}`
                            : assignment.email?.[0].toUpperCase()
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {assignment.status === 'ACTIVE' && assignment.user
                            ? `${assignment.user.firstName} ${assignment.user.lastName}`
                            : assignment.email
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.status === 'ACTIVE' 
                            ? assignment.user?.email
                            : assignment.status === 'PENDING'
                            ? 'Email davetiyesi bekliyor'
                            : assignment.status
                          }
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {assignment.status === 'PENDING' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Bekliyor
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Email davetiyesi gönderildi</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAssignment(assignment.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Atamayı kaldır</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Yeni Atama Formu */}
          <div>
            <h3 className="text-sm font-medium mb-3">Yeni Atama</h3>
            
            <div className="space-y-4">
              {/* Kullanıcı Seçici */}
              <div>
                <Label className="text-sm font-medium">Kullanıcı Seç</Label>
                <UserPicker
                  selectedUserIds={selectedUserIds}
                  onSelectionChangeIds={setSelectedUserIds}
                  placeholder="Kullanıcı ara ve seç..."
                />
              </div>

              {/* Email Girişi */}
              <div>
                <Label className="text-sm font-medium">Email Davetiyesi</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addEmail()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {emails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeEmail(email)}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {email}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Mesaj */}
              <div>
                <Label className="text-sm font-medium">Mesaj (Opsiyonel)</Label>
                <Textarea
                  placeholder="Atama ile ilgili bir mesaj..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isSubmitting || (selectedUserIds.length === 0 && emails.length === 0)}
            >
              {isSubmitting ? 'Atanıyor...' : 'Ata'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}