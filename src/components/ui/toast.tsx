"use client"

import React from "react"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useToastStore } from "@/store/toastStore"

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          action={toast.action}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

interface ToastProps {
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onClose: () => void
}

export function Toast({ message, action, onClose }: ToastProps) {
  return (
    <div className={cn(
      "bg-card border rounded-lg shadow-lg p-4 min-w-[300px]",
      "animate-in slide-in-from-right-full duration-300",
      "flex items-center justify-between"
    )}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:underline"
              onClick={() => {
                action.onClick()
                onClose()
              }}
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}