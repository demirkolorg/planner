import { create } from 'zustand'

interface ToastItem {
  id: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const newToast = { ...toast, id }
    
    set(state => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      get().removeToast(id)
    }, toast.duration || 5000)
  },
  
  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  }
}))