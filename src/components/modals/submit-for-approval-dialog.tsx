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
import { AlertTriangle, Send } from "lucide-react"

interface SubmitForApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (message: string) => void
  taskTitle: string
  isLoading?: boolean
}

export function SubmitForApprovalDialog({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
  isLoading = false
}: SubmitForApprovalDialogProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSubmit(message.trim())
      setMessage("")
    }
  }

  const handleClose = () => {
    setMessage("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Görevi Onaya Gönder
          </DialogTitle>
          <DialogDescription>
            <strong>"{taskTitle}"</strong> görevini tamamladınız ve onaya göndermek istiyorsunuz. 
            Görev sahibi inceleme yapacak ve onaylayacaktır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approval-message">
              Onay Mesajı <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="approval-message"
              placeholder="Görevi neden tamamlandı olarak işaretlediğinizi açıklayın..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
              required
              disabled={isLoading}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-muted">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Dikkat:</p>
                <p>Bu işlem sonrasında görevi düzenleyemeyeceksiniz. Görev sahibi onay verene kadar beklemede kalacaktır.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Onaya Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}