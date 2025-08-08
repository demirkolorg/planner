"use client"

import React, { useState, useEffect } from 'react'
import { X, User, Mail, Clock, Shield, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

interface AssignedUser {
  id: string
  firstName: string
  lastName: string
  email: string
  assignedAt: string
  assignedBy?: {
    firstName: string
    lastName: string
  }
}

interface PendingEmailAssignment {
  id: string
  email: string
  assignedAt: string
  expiresAt?: string
  status: 'PENDING' | 'EXPIRED' | 'CANCELLED'
  assignedBy?: {
    firstName: string
    lastName: string
  }
}

type AssignmentTargetType = 'PROJECT' | 'SECTION' | 'TASK'

interface AssignmentTarget {
  id: string
  name: string
  type: AssignmentTargetType
}

interface AssignedUsersModalProps {
  isOpen: boolean
  onClose: () => void
  target: AssignmentTarget | null
  onRefresh?: () => void
}

export function AssignedUsersModal({
  isOpen,
  onClose,
  target,
  onRefresh
}: AssignedUsersModalProps) {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([])
  const [pendingEmails, setPendingEmails] = useState<PendingEmailAssignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  // Atanmış kullanıcıları yükle
  const loadAssignments = async () => {
    if (!target || !isOpen) return

    setIsLoading(true)
    try {
      let endpoint = ''
      if (target.type === 'PROJECT') {
        endpoint = `/api/projects/${target.id}/assignments/list`
      } else if (target.type === 'SECTION') {
        endpoint = `/api/sections/${target.id}/assignments/list`
      } else if (target.type === 'TASK') {
        endpoint = `/api/tasks/${target.id}/assignments/list`
      }

      const response = await fetch(endpoint)
      const data = await response.json()

      if (response.ok) {
        setAssignedUsers(data.userAssignments || [])
        setPendingEmails(data.emailAssignments || [])
      } else {
        toast.error('Atamalar yüklenemedi: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Assignment loading error:', error)
      toast.error('Atamalar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Modal açıldığında atamaları yükle
  useEffect(() => {
    loadAssignments()
  }, [isOpen, target])

  // Kullanıcı atamasını kaldır
  const handleRemoveUserAssignment = async (userId: string) => {
    if (!target) return

    setIsRemoving(userId)
    try {
      let endpoint = ''
      if (target.type === 'PROJECT') {
        endpoint = `/api/projects/${target.id}/assignments/${userId}`
      } else if (target.type === 'SECTION') {
        endpoint = `/api/sections/${target.id}/assignments/${userId}`
      } else if (target.type === 'TASK') {
        endpoint = `/api/tasks/${target.id}/assignments/${userId}`
      }

      const response = await fetch(endpoint, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Atama kaldırıldı')
        await loadAssignments() // Listeyi yenile
        onRefresh?.() // Ana sayfayı da yenile
      } else {
        const data = await response.json()
        toast.error('Atama kaldırılamadı: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Remove assignment error:', error)
      toast.error('Atama kaldırılırken hata oluştu')
    } finally {
      setIsRemoving(null)
    }
  }

  // Email atamasını iptal et
  const handleCancelEmailAssignment = async (assignmentId: string) => {
    setIsRemoving(assignmentId)
    try {
      const response = await fetch(`/api/assignments/email/${assignmentId}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Email ataması iptal edildi')
        await loadAssignments()
        onRefresh?.()
      } else {
        const data = await response.json()
        toast.error('Email ataması iptal edilemedi: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Cancel email assignment error:', error)
      toast.error('Email ataması iptal edilirken hata oluştu')
    } finally {
      setIsRemoving(null)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!target) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {target.name} - Atanmış Kişiler
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

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
              <div className="h-16 bg-muted rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {/* Assigned Users */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Atanmış Kullanıcılar
                  </h3>
                  <Badge variant="secondary">{assignedUsers.length}</Badge>
                </div>

                {assignedUsers.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground">Henüz atanmış kullanıcı yok</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-sm">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Atandı: {formatDate(user.assignedAt)}</span>
                            {user.assignedBy && (
                              <>
                                <span>•</span>
                                <span>Atan: {user.assignedBy.firstName} {user.assignedBy.lastName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveUserAssignment(user.id)}
                                disabled={isRemoving === user.id}
                              >
                                {isRemoving === user.id ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <UserX className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Atamayı kaldır</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Email Assignments */}
              {pendingEmails.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Bekleyen Email Atamaları
                      </h3>
                      <Badge variant="outline">{pendingEmails.length}</Badge>
                    </div>

                    <div className="space-y-2">
                      {pendingEmails.map((emailAssignment) => (
                        <div key={emailAssignment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 w-9 h-9 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-orange-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {emailAssignment.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Gönderildi: {formatDate(emailAssignment.assignedAt)}</span>
                              {emailAssignment.expiresAt && (
                                <>
                                  <span>•</span>
                                  <span>Süre: {formatDate(emailAssignment.expiresAt)}</span>
                                </>
                              )}
                            </div>
                            {emailAssignment.assignedBy && (
                              <div className="text-xs text-muted-foreground">
                                Gönderen: {emailAssignment.assignedBy.firstName} {emailAssignment.assignedBy.lastName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={emailAssignment.status === 'PENDING' ? 'outline' : 'destructive'}
                              className="text-xs"
                            >
                              {emailAssignment.status === 'PENDING' ? 'Bekliyor' : 
                               emailAssignment.status === 'EXPIRED' ? 'Süresi Doldu' : 'İptal Edildi'}
                            </Badge>

                            {emailAssignment.status === 'PENDING' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => handleCancelEmailAssignment(emailAssignment.id)}
                                      disabled={isRemoving === emailAssignment.id}
                                    >
                                      {isRemoving === emailAssignment.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                      ) : (
                                        <X className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Daveti iptal et</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}