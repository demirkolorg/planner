"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  buttonText?: string
}

export function NotificationDialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  buttonText = "Tamam"
}: NotificationDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "bg-green-100 dark:bg-green-900/20"
      case "error":
        return "bg-red-100 dark:bg-red-900/20"
      case "warning":
        return "bg-yellow-100 dark:bg-yellow-900/20"
      default:
        return "bg-blue-100 dark:bg-blue-900/20"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-10 h-10 ${getIconBg()} rounded-full flex items-center justify-center`}>
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Bildirim penceresi: {type} türünde mesaj gösteriliyor
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="min-w-[100px]">
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}