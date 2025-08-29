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

        <ScrollArea className="max-h-80">
          {isLoading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Bildirimler yükleniyor...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Henüz bildiriminiz yok
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {getNotificationTypeText(notification.type)}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </span>
                      </div>
                      
                      <h5 className="font-medium text-sm leading-none">
                        {notification.title}
                      </h5>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {notification.creator && (
                        <p className="text-xs text-muted-foreground">
                          {notification.creator.firstName} {notification.creator.lastName}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleMarkAsRead(e, notification.id)}
                          className="h-6 w-6 p-0 hover:bg-green-100"
                          title="Okundu olarak işaretle"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100"
                        title="Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-2 left-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  )
}