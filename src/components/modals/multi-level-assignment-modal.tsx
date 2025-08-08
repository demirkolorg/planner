"use client"

import React, { useState, useEffect } from 'react'
import { X, Users, Mail, User, FolderKanban, List, CheckSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserPicker } from '@/components/ui/user-picker'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

type AssignmentTargetType = 'PROJECT' | 'SECTION' | 'TASK'

interface AssignmentTarget {
  id: string
  name: string
  type: AssignmentTargetType
  projectId?: string
}

interface MultiLevelAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  target: AssignmentTarget | null
  onSuccess?: () => void
}

interface EmailInput {
  id: string
  email: string
  isValid: boolean
}

export function MultiLevelAssignmentModal({
  isOpen,
  onClose,
  target,
  onSuccess
}: MultiLevelAssignmentModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [emailInputs, setEmailInputs] = useState<EmailInput[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or target changes
  useEffect(() => {
    if (!isOpen || !target) {
      setSelectedUsers([])
      setEmailInputs([])
      setNewEmail('')
      setMessage('')
      setSelectedRole('')
    } else {
      // Set default role based on target type
      if (target.type === 'PROJECT') {
        setSelectedRole('COLLABORATOR')
      } else {
        setSelectedRole('MEMBER')
      }
    }
  }, [isOpen, target])

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Add email to the list
  const handleAddEmail = () => {
    if (!newEmail.trim()) return

    const email = newEmail.trim().toLowerCase()
    const isValid = validateEmail(email)

    // Check for duplicates
    const isDuplicate = emailInputs.some(item => item.email === email)
    if (isDuplicate) {
      toast.error('Bu email zaten listede')
      return
    }

    setEmailInputs(prev => [...prev, {
      id: Date.now().toString(),
      email,
      isValid
    }])
    setNewEmail('')
  }

  // Remove email from list
  const handleRemoveEmail = (id: string) => {
    setEmailInputs(prev => prev.filter(item => item.id !== id))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!target) return

    const validEmails = emailInputs.filter(item => item.isValid).map(item => item.email)
    const userIds = selectedUsers.map(user => user.id)

    if (userIds.length === 0 && validEmails.length === 0) {
      toast.error('En az bir kullanıcı veya email adresi seçmelisiniz')
      return
    }

    setIsSubmitting(true)

    try {
      let endpoint = ''
      
      if (target.type === 'PROJECT') {
        endpoint = `/api/projects/${target.id}/assignments`
      } else if (target.type === 'SECTION') {
        endpoint = `/api/sections/${target.id}/assignments`
      } else if (target.type === 'TASK') {
        // Task assignment için mevcut endpoint'i kullan veya yeni bir tane oluştur
        endpoint = `/api/tasks/${target.id}/assign-multi`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assigneeIds: userIds.length > 0 ? userIds : undefined,
          emails: validEmails.length > 0 ? validEmails : undefined,
          role: selectedRole,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Atama işlemi başarısız')
      }

      // Success message
      const userCount = data.userAssignments?.length || 0
      const emailCount = data.emailAssignments?.length || 0
      
      let successMessage = ''
      if (userCount > 0 && emailCount > 0) {
        successMessage = `${userCount} kullanıcı ve ${emailCount} email ataması oluşturuldu`
      } else if (userCount > 0) {
        successMessage = `${userCount} kullanıcı atandı`
      } else if (emailCount > 0) {
        successMessage = `${emailCount} email ataması oluşturuldu`
      }

      toast.success(successMessage)

      // Show any errors
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error: string) => {
          toast.warning(error)
        })
      }

      onSuccess?.()
      onClose()

    } catch (error) {
      console.error('Assignment error:', error)
      toast.error(error instanceof Error ? error.message : 'Atama işlemi başarısız')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get role options based on target type
  const getRoleOptions = () => {
    if (target?.type === 'PROJECT') {
      return [
        { value: 'COLLABORATOR', label: 'İş Ortağı', description: 'Tüm projede çalışabilir' },
        { value: 'VIEWER', label: 'İzleyici', description: 'Sadece görüntüleyebilir' }
      ]
    } else {
      return [
        { value: 'OWNER', label: 'Sorumlu', description: 'Tam yetki sahibi' },
        { value: 'MEMBER', label: 'Üye', description: 'Çalışma yetkisi' }
      ]
    }
  }

  // Get target icon
  const getTargetIcon = () => {
    if (!target) return null
    
    switch (target.type) {
      case 'PROJECT':
        return <FolderKanban className="h-5 w-5" />
      case 'SECTION':
        return <List className="h-5 w-5" />
      case 'TASK':
        return <CheckSquare className="h-5 w-5" />
      default:
        return null
    }
  }

  if (!target) return null

  const roleOptions = getRoleOptions()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTargetIcon()}
            {target.name} - Atama Yap
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Target Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">
                {target.type === 'PROJECT' ? 'Proje' : target.type === 'SECTION' ? 'Bölüm' : 'Görev'}
              </span>
              <span>•</span>
              <span>{target.name}</span>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Rol Seçin</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin..." />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* User Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Kullanıcı Seç
            </Label>
            <UserPicker
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
              projectId={target.projectId}
              multiple={true}
              placeholder="Kullanıcı ara ve seç..."
            />
          </div>

          <Separator />

          {/* Email Assignment */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email ile Ata (Kayıtsız kullanıcılar için)
            </Label>
            
            {/* Add Email Input */}
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddEmail()
                  }
                }}
              />
              <Button 
                onClick={handleAddEmail}
                variant="outline"
                disabled={!newEmail.trim()}
              >
                Ekle
              </Button>
            </div>

            {/* Email List */}
            {emailInputs.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Eklenen Email Adresleri:
                </div>
                <div className="flex flex-wrap gap-2">
                  {emailInputs.map((emailInput) => (
                    <Badge
                      key={emailInput.id}
                      variant={emailInput.isValid ? "secondary" : "destructive"}
                      className="flex items-center gap-2 pr-1"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{emailInput.email}</span>
                      {!emailInput.isValid && <AlertCircle className="h-3 w-3" />}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveEmail(emailInput.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional Message */}
          <div className="space-y-2">
            <Label>Mesaj (İsteğe bağlı)</Label>
            <Textarea
              placeholder="Atama hakkında kişiselleştirilmiş bir mesaj yazabilirsiniz..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              İptal
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || (!selectedUsers.length && !emailInputs.some(item => item.isValid))}
            >
              {isSubmitting ? 'Atama Yapılıyor...' : 'Atama Yap'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}