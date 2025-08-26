"use client"

import { useState, useEffect, useCallback } from "react"
import { Undo2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UndoToastProps {}

interface UndoToastMessage {
  id: string
  message: string
  taskData: unknown
  undoAction: () => void
  duration?: number
}

export function UndoToast({}: UndoToastProps) {
  const [toasts, setToasts] = useState<UndoToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addUndoToast = useCallback((toast: UndoToastMessage) => {
    setToasts(prev => [...prev, toast])

    // Auto remove after 5 seconds (undo window)
    const timeoutId = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration || 5000)

    return timeoutId
  }, [removeToast])

  useEffect(() => {
    const handleUndoToast = (event: CustomEvent) => {
      const toastId = Date.now().toString()
      
      addUndoToast({
        id: toastId,
        message: event.detail.message,
        taskData: event.detail.taskData,
        undoAction: event.detail.undoAction,
        duration: 5000
      })
    }

    window.addEventListener('showUndoToast', handleUndoToast as EventListener)

    return () => {
      window.removeEventListener('showUndoToast', handleUndoToast as EventListener)
    }
  }, [addUndoToast])

  const handleUndo = async (toast: UndoToastMessage) => {
    try {
      // Remove toast immediately
      removeToast(toast.id)
      
      // Execute undo action
      await toast.undoAction()
    } catch (error) {
      console.error('Undo failed:', error)
      // Toast will be handled by the undo action itself
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-[200] space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center justify-between space-x-3 p-4 bg-gray-900/95 dark:bg-gray-100/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 dark:border-gray-300 animate-in slide-in-from-left-full duration-300"
        >
          <div className="flex items-center space-x-3">
            <div className="text-white dark:text-gray-900">
              <Undo2 className="w-5 h-5" />
            </div>
            
            <p className="text-sm font-medium text-white dark:text-gray-900">
              {toast.message}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUndo(toast)}
              className="h-8 px-3 bg-white/20 hover:bg-white/30 text-white dark:bg-gray-900/20 dark:hover:bg-gray-900/30 dark:text-gray-900 border-white/20 dark:border-gray-900/20"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Geri Al
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeToast(toast.id)}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 dark:text-gray-900/70 dark:hover:text-gray-900 dark:hover:bg-gray-900/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}