import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/lib/constants'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  setUser: (user: User) => void
  updateProfile: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user: User) => {
        // Yeni kullanıcı giriş yaptığında diğer store'ları temizle
        if (typeof window !== 'undefined') {
          Promise.all([
            import('./taskStore'),
            import('./projectStore')
          ]).then(([taskStore, projectStore]) => {
            // Store'ları resetle
            taskStore.useTaskStore.setState({
              tasks: [],
              isLoading: false,
              error: null,
              showCompletedTasks: false
            })
            
            projectStore.useProjectStore.setState({
              projects: [],
              sections: [],
              isLoading: false,
              error: null
            })
          }).catch(error => {
            console.error('Store reset hatası:', error)
          })
        }
        
        set({ user, isAuthenticated: true })
      },
      logout: async () => {
        try {
          // Server'dan logout yap
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Logout API hatası:', error)
        }
        
        // Store'u temizle
        set({ user: null, isAuthenticated: false })
        
        // Diğer store'ları temizle (eğer import edilmişlerse)
        if (typeof window !== 'undefined') {
          // Tüm store'ları sıfırla
          const { useTaskStore } = await import('./taskStore')
          const { useProjectStore } = await import('./projectStore')
          
          // Store'ları resetle
          useTaskStore.setState({
            tasks: [],
            isLoading: false,
            error: null,
            showCompletedTasks: false
          })
          
          useProjectStore.setState({
            projects: [],
            isLoading: false,
            error: null
          })
          
          // LocalStorage'ı temizle
          localStorage.clear()
        }
      },
      setUser: (user: User) => set({ user, isAuthenticated: true }),
      updateProfile: (updates: Partial<User>) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: STORAGE_KEYS.AUTH_STORAGE,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)