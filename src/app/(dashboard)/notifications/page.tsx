"use client"

import React, { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Filter, Search, ChevronDown, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationType, NotificationPriority, InAppNotification } from '@/types/notification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const typeLabels = {
  REMINDER: 'Hatırlatıcılar',
  TASK_DUE: 'Görev Süreleri',
  TASK_OVERDUE: 'Geciken Görevler',
  SYSTEM: 'Sistem Bildirimleri'
}

const typeColors = {
  REMINDER: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  TASK_DUE: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  TASK_OVERDUE: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  SYSTEM: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
}

const priorityColors = {
  LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  HIGH: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  URGENT: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
}

export default function NotificationsPage() {
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

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(typeLabels)))

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filtreleme
  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (selectedType !== 'all' && notification.type !== selectedType) return false
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) return false
    if (showOnlyUnread && notification.isRead) return false
    return true
  })

  // Kategorilere göre gruplama
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const type = notification.type as NotificationType
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(notification)
    return groups
  }, {} as Record<NotificationType, InAppNotification[]>)

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    
    if (notification.taskId) {
      // Task detayına yönlendir
      console.log('Task detayına yönlendir:', notification.taskId)
    }
  }

  const toggleGroup = (type: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Bildirimler</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="destructive" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-2" />
              Tümünü Temizle
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 mb-6 border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bildirimlerde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tür seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              {Object.entries(typeLabels).map(([type, label]) => (
                <SelectItem key={type} value={type}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Öncelik seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="URGENT">Acil</SelectItem>
              <SelectItem value="HIGH">Yüksek</SelectItem>
              <SelectItem value="MEDIUM">Orta</SelectItem>
              <SelectItem value="LOW">Düşük</SelectItem>
            </SelectContent>
          </Select>

          {/* Unread Filter */}
          <Button
            variant={showOnlyUnread ? "default" : "outline"}
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showOnlyUnread ? 'Tümü' : 'Okunmamış'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Bildirimler yükleniyor...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery || selectedType !== 'all' || selectedPriority !== 'all' || showOnlyUnread 
              ? 'Filtre kriterlerine uygun bildirim bulunamadı' 
              : 'Henüz bildirim yok'
            }
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedType !== 'all' || selectedPriority !== 'all' || showOnlyUnread
              ? 'Farklı filtre seçeneklerini deneyebilirsiniz.'
              : 'Hatırlatıcılarınız ve sistem bildirimleri burada görünecek.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([type, groupNotifications]) => {
            const isExpanded = expandedGroups.has(type)
            const unreadInGroup = groupNotifications.filter(n => !n.isRead).length
            
            return (
              <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleGroup(type)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 bg-card rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <ChevronDown className={cn(
                        "h-5 w-5 transition-transform",
                        !isExpanded && "-rotate-90"
                      )} />
                      <h2 className="text-xl font-semibold">
                        {typeLabels[type as NotificationType]}
                      </h2>
                      <Badge variant="secondary" className={typeColors[type as NotificationType]}>
                        {groupNotifications.length}
                      </Badge>
                      {unreadInGroup > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadInGroup} yeni
                        </Badge>
                      )}
                    </div>
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-2">
                  <div className="space-y-2">
                    {groupNotifications
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                          'hover:shadow-md hover:scale-[1.01]',
                          !notification.isRead 
                            ? 'bg-accent/20 border-primary/20' 
                            : 'bg-card hover:bg-accent/50'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
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
                            
                            <h3 className="font-medium text-sm mb-1">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(new Date(notification.createdAt))}</span>
                              </div>
                              <span>{formatDate(new Date(notification.createdAt))}</span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}