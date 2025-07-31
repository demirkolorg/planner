"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastNotificationProps {}

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
  duration?: number
}

export function ToastNotification({}: ToastNotificationProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handleSuccess = (event: CustomEvent) => {
      addToast({
        id: Date.now().toString(),
        message: event.detail.message,
        type: 'success',
        duration: 3000
      })
    }

    const handleError = (event: CustomEvent) => {
      addToast({
        id: Date.now().toString(),
        message: event.detail.message,
        type: 'error',
        duration: 5000
      })
    }

    window.addEventListener('quickTaskSuccess', handleSuccess as EventListener)
    window.addEventListener('quickTaskError', handleError as EventListener)

    return () => {
      window.removeEventListener('quickTaskSuccess', handleSuccess as EventListener)
      window.removeEventListener('quickTaskError', handleError as EventListener)
    }
  }, [])

  const addToast = (toast: ToastMessage) => {
    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (toast.duration) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-full duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50/90 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className={`flex-shrink-0 w-5 h-5 ${
            toast.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          
          <p className={`text-sm font-medium ${
            toast.type === 'success' 
              ? 'text-green-800 dark:text-green-100' 
              : 'text-red-800 dark:text-red-100'
          }`}>
            {toast.message}
          </p>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4 opacity-50 hover:opacity-100" />
          </Button>
        </div>
      ))}
    </div>
  )
}