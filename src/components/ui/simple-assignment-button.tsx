"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimpleAssignmentModal } from '@/components/modals/simple-assignment-modal'

interface SimpleAssignmentButtonProps {
  targetType: 'PROJECT' | 'SECTION' | 'TASK'
  targetId: string
  targetName: string
  onRefresh?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'default' | 'lg'
  showCounts?: boolean
}

export function SimpleAssignmentButton({
  targetType,
  targetId,
  targetName,
  onRefresh,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  showCounts = true
}: SimpleAssignmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [assignmentCount, setAssignmentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Atama sayısını getir
  const fetchAssignmentCount = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/assignments?targetType=${targetType}&targetId=${targetId}`)
      
      if (response.ok) {
        const data = await response.json()
        setAssignmentCount(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching assignment count:', error)
    } finally {
      setIsLoading(false)
    }
  }, [targetType, targetId])

  // Component mount edildiğinde sayıyı yükle
  useEffect(() => {
    fetchAssignmentCount()
  }, [targetType, targetId, fetchAssignmentCount])

  const handleSuccess = () => {
    fetchAssignmentCount()
    onRefresh?.()
  }

  const hasAssignments = assignmentCount > 0

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 relative"
          disabled={disabled || isLoading}
          onClick={() => setIsModalOpen(true)}
        >
          {hasAssignments ? (
            <Users className="h-3 w-3" />
          ) : (
            <UserPlus className="h-3 w-3" />
          )}
          {hasAssignments && showCounts && (
            <div 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
              style={{ backgroundColor: '#3b82f6' }}
            />
          )}
        </Button>
        
        <SimpleAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          targetType={targetType}
          targetId={targetId}
          targetName={targetName}
          onSuccess={handleSuccess}
        />
      </>
    )
  }

  // Full button variant
  return (
    <>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className="flex items-center gap-2"
        onClick={() => setIsModalOpen(true)}
      >
        {hasAssignments ? (
          <Users className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        <span>
          {hasAssignments ? 'Atamalar' : 'Atama Yap'}
        </span>
        {showCounts && hasAssignments && (
          <Badge variant="secondary" className="text-xs">
            {assignmentCount}
          </Badge>
        )}
      </Button>
      
      <SimpleAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        onSuccess={handleSuccess}
      />
    </>
  )
}