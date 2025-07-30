import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GoogleCalendarState {
  isConnected: boolean
  lastSyncAt: string | null
  isSyncing: boolean
  setConnected: (connected: boolean) => void
  setLastSyncAt: (date: string | null) => void
  setIsSyncing: (syncing: boolean) => void
  updateSyncStatus: () => Promise<void>
}

export const useGoogleCalendarStore = create<GoogleCalendarState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      lastSyncAt: null,
      isSyncing: false,
      
      setConnected: (connected) => set({ isConnected: connected }),
      setLastSyncAt: (date) => set({ lastSyncAt: date }),
      setIsSyncing: (syncing) => set({ isSyncing: syncing }),
      
      // Google Calendar durumunu API'den kontrol et ve güncelle
      updateSyncStatus: async () => {
        try {
          const response = await fetch('/api/google/auth/status')
          const data = await response.json()
          
          if (data.success && data.connected) {
            set({ 
              isConnected: true,
              lastSyncAt: data.integration?.lastSyncAt || null
            })
          } else {
            set({ 
              isConnected: false,
              lastSyncAt: null
            })
          }
        } catch (error) {
          console.error('Google Calendar durum kontrol hatası:', error)
          set({ 
            isConnected: false,
            lastSyncAt: null
          })
        }
      }
    }),
    {
      name: 'google-calendar-store',
      // Sadece bağlantı durumunu ve son sync zamanını persist et
      partialize: (state) => ({
        isConnected: state.isConnected,
        lastSyncAt: state.lastSyncAt
      })
    }
  )
)