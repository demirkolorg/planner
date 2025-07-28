"use client"

import React, { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Settings, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationType, NotificationPriority } from '@/types/notification'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const priorityColors = {
  LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  HIGH: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  URGENT: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
}

const typeColors = {
  REMINDER: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  TASK_DUE: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  TASK_OVERDUE: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  SYSTEM: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
}

const typeLabels = {
  REMINDER: 'Hatırlatıcı',
  TASK_DUE: 'Görev Süresi Doluyor',
  TASK_OVERDUE: 'Görev Gecikti',
  SYSTEM: 'Sistem'
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotificationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'Şimdi'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    if (diffInHours < 24) return `${diffInHours} saat önce`
    if (diffInDays < 7) return `${diffInDays} gün önce`
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleNotificationClick = async (notificationId: string, taskId?: string) => {
    await markAsRead(notificationId)
    
    if (taskId) {
      // Task detayına yönlendir
      console.log('Task detayına yönlendir:', taskId)
    }
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-96 p-0"
          sideOffset={5}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Bildirimler</h3>
            <div className="flex items-center space-x-2">
              <Link href={ROUTES.NOTIFICATIONS}>
                <Button variant="ghost" size="sm" className="text-xs">
                  Tümünü Gör
                </Button>
              </Link>
              {unreadCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={markAllAsRead}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tümünü okundu işaretle</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {notifications.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={clearAll}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tümünü temizle</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Bildirimler yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors mb-2',
                      'hover:bg-accent/50',
                      !notification.isRead && 'bg-accent/20'
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.taskId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', typeColors[notification.type as NotificationType])}
                          >
                            {typeLabels[notification.type as NotificationType]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', priorityColors[notification.priority as NotificationPriority])}
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <DropdownMenuItem asChild className="w-full justify-center">
                  <Link href={ROUTES.NOTIFICATIONS} className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Tüm Bildirimler
                  </Link>
                </DropdownMenuItem>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}