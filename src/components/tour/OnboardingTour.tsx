"use client"

import React from 'react'
import { TourProvider, useTour } from '@reactour/tour'
import { Button } from '@/components/ui/button'
import { useTourStore } from '@/store/tourStore'
import { onboardingSteps, featureTourSteps, tourConfig } from '@/lib/tour-steps'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { useEffect } from 'react'

interface OnboardingTourProps {
  children: React.ReactNode
}

export function OnboardingTour({ children }: OnboardingTourProps) {
  const { 
    isOpen, 
    currentStep, 
    showFeatureTour,
    closeTour, 
    nextStep, 
    prevStep, 
    completeTour 
  } = useTourStore()

  // Hangi tour gösterileceğini belirle
  const steps = showFeatureTour 
    ? featureTourSteps[showFeatureTour] || []
    : onboardingSteps

  const isLastStep = currentStep === steps.length - 1

  return (
    <TourProvider
      steps={steps}
      isOpen={isOpen}
      currentStep={currentStep}
      onRequestClose={closeTour}
      {...tourConfig}
      // Custom navigation ile kendi butonlarımızı kullanacağız
      showNavigation={false}
      showCloseButton={false}
      ContentComponent={({ content, setCurrentStep, currentStep, steps }) => (
        <TourContent
          content={content}
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={completeTour}
          onClose={closeTour}
          showPrev={currentStep > 0}
          showNext={!isLastStep}
          isLastStep={isLastStep}
        />
      )}
    >
      {children}
    </TourProvider>
  )
}

interface TourContentProps {
  content: React.ReactNode
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onClose: () => void
  showPrev: boolean
  showNext: boolean
  isLastStep: boolean
}

function TourContent({
  content,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose,
  showPrev,
  showNext,
  isLastStep
}: TourContentProps) {
  return (
    <div className="max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-primary">
              {currentStep + 1}
            </span>
            <span className="text-sm text-muted-foreground">
              / {totalSteps}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Skip Button */}
          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs h-8 px-2"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Atla
            </Button>
          )}
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary rounded-full h-1.5 mb-4">
        <div 
          className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="mb-6">
        {content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {showPrev && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              className="h-9"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
          )}
        </div>

        <div>
          {showNext ? (
            <Button
              size="sm"
              onClick={onNext}
              className="h-9"
            >
              İleri
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onSkip}
              className="h-9 bg-gradient-to-r from-primary to-secondary"
            >
              🎉 Tamamla
            </Button>
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center space-x-1 mt-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentStep
                ? 'bg-primary scale-125'
                : index < currentStep
                ? 'bg-primary/60'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}