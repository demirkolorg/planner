"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, User, Clock, AlertTriangle } from "lucide-react"

interface ApprovalActionDialogProps {
  isOpen: boolean
  onClose: () => void
  onApprove: (message?: string) => void
  onReject: (message: string) => void
  taskTitle: string
  approvalMessage?: string
  requesterName?: string
  requestedAt?: string
  isLoading?: boolean
}

export function ApprovalActionDialog({
  isOpen,
  onClose,
  onApprove,
  onReject,
  taskTitle,
  approvalMessage,
  requesterName,
  requestedAt,
  isLoading = false
}: ApprovalActionDialogProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [message, setMessage] = useState("")

  const handleAction = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction)
    if (selectedAction === 'approve') {
      setMessage("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (action === 'approve') {
      onApprove(message.trim() || undefined)
    } else if (action === 'reject') {
      if (message.trim()) {
        onReject(message.trim())
      }
    }
    handleClose()
  }

  const handleClose = () => {
    setAction(null)
    setMessage("")
    onClose()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Onay Talebi
          </DialogTitle>
          <DialogDescription>
            <strong>"{taskTitle}"</strong> görevi için onay talebi geldi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Talep Detayları */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Talep Eden:</span>
              <span className="text-sm">{requesterName || "Bilinmiyor"}</span>
            </div>
            
            {requestedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tarih:</span>
                <span className="text-sm">{formatDate(requestedAt)}</span>
              </div>
            )}

            {approvalMessage && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Mesaj:</span>
                <div className="bg-background p-3 rounded border text-sm">
                  {approvalMessage}
                </div>
              </div>
            )}
          </div>

          {/* Aksiyon Seçimi */}
          {!action && (
            <div className="space-y-3">
              <Label>Bu talebi nasıl değerlendirmek istiyorsunuz?</Label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-auto p-4 border-green-200 hover:bg-green-50 hover:border-green-300"
                  onClick={() => handleAction('approve')}
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Onayla</div>
                    <div className="text-xs text-muted-foreground">Görevi tamamlandı olarak işaretle</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 gap-2 h-auto p-4 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleAction('reject')}
                >
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Reddet</div>
                    <div className="text-xs text-muted-foreground">Revizyon isteyerek geri gönder</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Mesaj Girme Alanı */}
          {action && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                {action === 'approve' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {action === 'approve' ? 'Görevi Onaylıyorsunuz' : 'Görevi Reddediyorsunuz'}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action-message">
                  {action === 'approve' ? 'Onay Mesajı (Opsiyonel)' : 'Ret Sebebi *'}
                </Label>
                <Textarea
                  id="action-message"
                  placeholder={
                    action === 'approve' 
                      ? "Onay mesajınızı yazın..." 
                      : "Neden reddedildiğini açıklayın..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                  required={action === 'reject'}
                  disabled={isLoading}
                />
              </div>

              {action === 'reject' && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <p className="font-medium mb-1">Not:</p>
                      <p>Görevi reddederseniz, atanmış kişi tekrar çalışıp yeniden onaya gönderebilir.</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAction(null)}
                  disabled={isLoading}
                >
                  Geri
                </Button>
                <Button
                  type="submit"
                  disabled={action === 'reject' && !message.trim() || isLoading}
                  variant={action === 'approve' ? 'default' : 'destructive'}
                  className="gap-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : action === 'approve' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {action === 'approve' ? 'Onayla' : 'Reddet'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}