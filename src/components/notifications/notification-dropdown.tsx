"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2, Settings, X, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotificationStore, Notification } from "@/store/notificationStore"

interface NotificationDropdownProps {
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function NotificationDropdown({ className, align = "end", side = "bottom" }: NotificationDropdownProps) {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
  } = useNotificationStore()

  const [isOpen, setIsOpen] = useState(false)

  // Dropdown açıldığında bildirimleri yükle
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications()
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: Notification) => {
    // Okunmamış bildirimi okundu olarak işaretle
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // Action URL'si varsa yönlendir
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await markAsRead(notificationId)
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return "📝"
      case "TASK_COMMENT":
        return "💬"
      case "TASK_STATUS_CHANGED":
        return "✅"
      case "TASK_DUE_SOON":
        return "⏰"
      case "PROJECT_INVITE":
        return "👥"
      case "PROJECT_UPDATE":
        return "📊"
      case "MENTION":
        return "@"
      default:
        return "🔔"
    }
  }

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case "TASK_ASSIGNED":
        return "Görev Ataması"
      case "TASK_COMMENT":
        return "Yeni Yorum"
      case "TASK_STATUS_CHANGED":
        return "Durum Değişikliği"
      case "TASK_DUE_SOON":
        return "Teslim Tarihi Yaklaştı"
      case "PROJECT_INVITE":
        return "Proje Daveti"
      case "PROJECT_UPDATE":
        return "Proje Güncellemesi"
      case "MENTION":
        return "Bahsedildiniz"
      default:
        return "Bildirim"
    }
  }

  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} side={side} className="w-96 max-h-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Bildirimler</h4>
          <div className="flex gap-1">
            {notifications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push("/notifications")
                      setIsOpen(false)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tümünü Görüntüle</p>
                </TooltipContent>
              </Tooltip>
            )}
            {notifications.some(n => n.isRead) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteAllRead}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Okunmuşları Sil</p>
                </TooltipContent>
              </Tooltip>
            )}
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-6 w-6 p-0"
                  >
                    <CheckCheck className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tümünü Okundu İşaretle</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push("/notifications/settings")
                    setIsOpen(false)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bildirim Ayarları</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex flex-col h-80 overflow-hidden">
          {isLoading && notifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground">Bildirimler yükleniyor...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Henüz bildiriminiz yok</p>
                  <p className="text-xs text-muted-foreground mt-1">Yeni bildirimleri burada göreceksiniz</p>
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-1 py-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative group p-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                      !notification.isRead 
                        ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-100/80 dark:hover:bg-blue-950/30" 
                        : "bg-white dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-base mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                            {getNotificationTypeText(notification.type)}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: tr
                            })}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h5 className="font-semibold text-sm leading-tight text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </h5>
                        
                        {/* Message */}
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {/* Creator */}
                        {notification.creator && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                              {notification.creator.firstName?.[0]}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {notification.creator.firstName} {notification.creator.lastName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.isRead && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                              >
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Okundu işaretle</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bildirimi sil</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  )
}