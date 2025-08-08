"use client"

import React, { useState } from 'react'
import { UserPlus, Users, Mail, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MultiLevelAssignmentModal } from '@/components/modals/multi-level-assignment-modal'

type AssignmentTargetType = 'PROJECT' | 'SECTION' | 'TASK'

interface AssignmentTarget {
  id: string
  name: string
  type: AssignmentTargetType
  projectId?: string
}

interface AssignmentCounts {
  userAssignments: number
  emailAssignments: number
}

interface MultiLevelAssignmentButtonProps {
  target: AssignmentTarget
  counts?: AssignmentCounts
  onRefresh?: () => void
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost' | 'icon'
  size?: 'sm' | 'default' | 'lg'
  showCounts?: boolean
}

export function MultiLevelAssignmentButton({
  target,
  counts,
  onRefresh,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  showCounts = true
}: MultiLevelAssignmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalAssignments = (counts?.userAssignments || 0) + (counts?.emailAssignments || 0)
  const hasAssignments = totalAssignments > 0

  const handleOpenModal = () => {
    if (!disabled) {
      setIsModalOpen(true)
    }
  }

  const handleSuccess = () => {
    onRefresh?.()
  }

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 relative"
          onClick={handleOpenModal}
          disabled={disabled}
        >
          {hasAssignments ? (
            <Users className="h-3 w-3" />
          ) : (
            <UserPlus className="h-3 w-3" />
          )}
          {hasAssignments && (
            <div 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
              style={{ backgroundColor: '#3b82f6' }}
            />
          )}
        </Button>
        
        <MultiLevelAssignmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          target={target}
          onSuccess={handleSuccess}
        />
      </>
    )
  }

  // Full button variant
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled}
            className="flex items-center gap-2"
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
                {totalAssignments}
              </Badge>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Yeni Atama Yap
          </DropdownMenuItem>
          
          {hasAssignments && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span>{counts?.userAssignments || 0} kullanıcı atanmış</span>
                  </div>
                  {counts?.emailAssignments ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{counts.emailAssignments} email ataması bekliyor</span>
                    </div>
                  ) : null}
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <MultiLevelAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        target={target}
        onSuccess={handleSuccess}
      />
    </>
  )
}