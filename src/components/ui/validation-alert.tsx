"use client"

import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ValidationAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
}

export function ValidationAlert({ isOpen, onClose, title, message }: ValidationAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-secondary border border-secondary rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed mt-4">
          {message}
        </AlertDialogDescription>

        <AlertDialogFooter className="mt-6">
          <AlertDialogAction onClick={onClose}>
            Tamam
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}