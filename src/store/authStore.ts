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

export interface SavedAccount {
  userId: string
  firstName: string
  lastName: string
  email: string
  token: string
  lastUsed: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  savedAccounts: SavedAccount[]
  login: (user: User, token?: string) => void
  logout: () => Promise<void>
  setUser: (user: User) => void
  updateProfile: (updates: Partial<User>) => void
  addAccount: (user: User, token: string) => void
  switchAccount: (userId: string) => Promise<boolean>
  removeAccount: (userId: string) => void
  getSavedAccounts: () => SavedAccount[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      savedAccounts: [],
      login: (user: User, token?: string) => {
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

        const currentState = get()
        const updatedSavedAccounts = [...currentState.savedAccounts]

        // Eğer token varsa (multi-account login), hesabı saved accounts'a ekle
        if (token) {
          const existingIndex = updatedSavedAccounts.findIndex(acc => acc.userId === user.id)
          const accountData: SavedAccount = {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            token,
            lastUsed: new Date().toISOString()
          }

          if (existingIndex >= 0) {
            // Mevcut hesabı güncelle
            updatedSavedAccounts[existingIndex] = accountData
          } else {
            // Yeni hesap ekle
            updatedSavedAccounts.push(accountData)
          }
        }
        
        set({ 
          user, 
          isAuthenticated: true, 
          savedAccounts: updatedSavedAccounts 
        })
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
          
          // Sadece kullanıcıya özel store'ları temizle, tema ayarlarını koru
          localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE)
          localStorage.removeItem('google-calendar-store')
          
          // Diğer kullanıcı verilerini de temizle (task ve project store'ları zaten yukarıda resetleniyor)
        }
      },
      setUser: (user: User) => set({ user, isAuthenticated: true }),
      updateProfile: (updates: Partial<User>) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      addAccount: (user: User, token: string) => {
        const currentState = get()
        const updatedSavedAccounts = [...currentState.savedAccounts]
        
        const existingIndex = updatedSavedAccounts.findIndex(acc => acc.userId === user.id)
        const accountData: SavedAccount = {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          token,
          lastUsed: new Date().toISOString()
        }

        if (existingIndex >= 0) {
          updatedSavedAccounts[existingIndex] = accountData
        } else {
          updatedSavedAccounts.push(accountData)
        }
        
        set({ savedAccounts: updatedSavedAccounts })
      },

      switchAccount: async (userId: string): Promise<boolean> => {
        try {
          const currentState = get()
          const targetAccount = currentState.savedAccounts.find(acc => acc.userId === userId)
          
          console.log('Switch account debug:', {
            userId,
            savedAccountsLength: currentState.savedAccounts.length,
            targetAccount: targetAccount ? { 
              userId: targetAccount.userId, 
              email: targetAccount.email, 
              hasToken: !!targetAccount.token 
            } : null
          })
          
          if (!targetAccount) {
            console.error('Target account not found')
            return false
          }

          const response = await fetch('/api/auth/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userToken: targetAccount.token })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Store'ları temizle (yeni kullanıcı için)
            // Not: Sayfa reload yapılacağı için store temizliği gerekli değil
            // Ancak API call'dan sonra state güncellemesi gerekiyor

            // Switched account'un lastUsed'ını güncelle
            const updatedSavedAccounts = currentState.savedAccounts.map(acc => 
              acc.userId === userId 
                ? { ...acc, lastUsed: new Date().toISOString() }
                : acc
            )
            
            set({ 
              user: data.user, 
              isAuthenticated: true,
              savedAccounts: updatedSavedAccounts
            })
            
            return true
          } else {
            // Hata detaylarını al
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Account switch failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            })
            return false
          }
        } catch (error) {
          console.error('Account switch error:', error)
          return false
        }
      },

      removeAccount: (userId: string) => {
        const currentState = get()
        const updatedSavedAccounts = currentState.savedAccounts.filter(acc => acc.userId !== userId)
        set({ savedAccounts: updatedSavedAccounts })
      },

      getSavedAccounts: () => {
        return get().savedAccounts
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORAGE,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        savedAccounts: state.savedAccounts,
      }),
    }
  )
)