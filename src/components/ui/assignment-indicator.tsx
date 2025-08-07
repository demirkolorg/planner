"use client"

import React from 'react'
import { Users, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AssignedUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AssignmentIndicatorProps {
  assignments?: AssignedUser[]
  owner?: AssignedUser
  size?: 'sm' | 'md' | 'lg'
  showOwner?: boolean
  maxDisplay?: number
  className?: string
}

export function AssignmentIndicator({
  assignments = [],
  owner,
  size = 'sm',
  showOwner = false,
  maxDisplay = 3,
  className
}: AssignmentIndicatorProps) {
  // Kullanıcının adı soyadı baş harflerini al
  const getUserInitials = (user: AssignedUser) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  // Kullanıcının tam adını al
  const getUserFullName = (user: AssignedUser) => {
    return `${user.firstName} ${user.lastName}`
  }

  // Avatar boyutları
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Gösterilecek kullanıcıları belirle
  const displayUsers = [...assignments].slice(0, maxDisplay)
  const remainingCount = Math.max(0, assignments.length - maxDisplay)

  // Hiç atama yoksa gösterme
  if (assignments.length === 0 && (!showOwner || !owner)) {
    return null
  }

  return (
    <div className={cn("flex items-center", className)}>
      {/* Sahip göstergesi */}
      {showOwner && owner && (
        <div className="flex items-center mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Avatar className={cn(sizeClasses[size], "ring-2 ring-primary")}>
                  <AvatarFallback className={cn(textSizeClasses[size], "font-medium bg-primary text-primary-foreground")}>
                    {getUserInitials(owner)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{getUserFullName(owner)}</p>
                <p className="text-xs text-muted-foreground">Sahip</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Atanan kullanıcılar */}
      {assignments.length > 0 && (
        <div className="flex items-center">
          {/* Atanan kullanıcı avatar'ları */}
          <div className="flex -space-x-2">
            {displayUsers.map((user, index) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Avatar 
                    className={cn(
                      sizeClasses[size],
                      "ring-2 ring-background border border-border",
                      "relative z-[1] hover:z-[2]"
                    )}
                    style={{ zIndex: displayUsers.length - index }}
                  >
                    <AvatarFallback className={cn(textSizeClasses[size], "font-medium")}>
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{getUserFullName(user)}</p>
                    <p className="text-xs text-muted-foreground">Atanan</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Kalan kullanıcı sayısı */}
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full flex items-center justify-center font-medium",
                      size === 'sm' && "h-6 w-6 text-xs",
                      size === 'md' && "h-8 w-8 text-sm",
                      size === 'lg' && "h-10 w-10 text-base"
                    )}
                  >
                    +{remainingCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{remainingCount} kullanıcı daha</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Atama ikonu ve sayısı */}
          <div className="ml-2 flex items-center text-muted-foreground">
            {assignments.length === 1 ? (
              <User className="h-3 w-3" />
            ) : (
              <>
                <Users className="h-3 w-3" />
                <span className="ml-1 text-xs font-medium">
                  {assignments.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}