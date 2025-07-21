"use client"

import { PriorityPicker } from "@/components/ui/priority-picker"

interface PrioritySelectorProps {
  currentPriority: string
  onUpdatePriority?: (priority: string) => void
  trigger?: React.ReactNode
}

export function PrioritySelector({ currentPriority, onUpdatePriority, trigger }: PrioritySelectorProps) {
  // İngilizce priority değerlerini Türkçe'ye çevir
  const priorityMapping: Record<string, string> = {
    'HIGH': 'Yüksek',
    'MEDIUM': 'Orta', 
    'LOW': 'Düşük',
    'NONE': 'Yok',
    'CRITICAL': 'Kritik'
  }
  
  // Türkçe priority değerlerini İngilizce'ye çevir
  const reversePriorityMapping: Record<string, string> = {
    'Yüksek': 'HIGH',
    'Orta': 'MEDIUM', 
    'Düşük': 'LOW',
    'Yok': 'NONE',
    'Kritik': 'CRITICAL'
  }

  const currentPriorityTurkish = priorityMapping[currentPriority] || currentPriority

  const handlePrioritySelect = (turkishPriority: string) => {
    const englishPriority = reversePriorityMapping[turkishPriority] || turkishPriority
    onUpdatePriority?.(englishPriority)
  }

  return (
    <PriorityPicker
      selectedPriority={currentPriorityTurkish}
      onPrioritySelect={handlePrioritySelect}
      trigger={trigger}
      dropdownPosition="top"
    />
  )
}