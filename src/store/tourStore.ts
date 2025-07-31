import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TourState {
  isOpen: boolean
  currentStep: number
  hasCompletedOnboarding: boolean
  showFeatureTour: string | null // Hangi özellik için tour gösteriliyor
  
  // Actions
  startTour: () => void
  closeTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  completeTour: () => void
  resetTour: () => void
  startFeatureTour: (featureName: string) => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      currentStep: 0,
      hasCompletedOnboarding: false,
      showFeatureTour: null,
      
      startTour: () => {
        set({ 
          isOpen: true, 
          currentStep: 0 
        })
      },
      
      closeTour: () => {
        set({ 
          isOpen: false, 
          currentStep: 0,
          showFeatureTour: null
        })
      },
      
      nextStep: () => {
        set((state) => ({ 
          currentStep: state.currentStep + 1 
        }))
      },
      
      prevStep: () => {
        set((state) => ({ 
          currentStep: Math.max(0, state.currentStep - 1) 
        }))
      },
      
      goToStep: (step: number) => {
        set({ currentStep: step })
      },
      
      completeTour: () => {
        set({ 
          isOpen: false,
          currentStep: 0,
          hasCompletedOnboarding: true,
          showFeatureTour: null
        })
      },
      
      resetTour: () => {
        set({ 
          isOpen: false,
          currentStep: 0,
          hasCompletedOnboarding: false,
          showFeatureTour: null
        })
      },
      
      startFeatureTour: (featureName: string) => {
        set({
          isOpen: true,
          currentStep: 0,
          showFeatureTour: featureName
        })
      }
    }),
    {
      name: 'planner-tour-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding
      })
    }
  )
)