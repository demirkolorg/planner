"use client"

import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from "next/navigation"
import { Settings, CheckCheck, Trash2, Filter, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotificationStore, Notification } from "@/store/notificationStore"

export default function NotificationsPage() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteSelected,
    deleteAllRead
  } = useNotificationStore()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  useEffect(() => {
    fetchNotifications({ unreadOnly: showUnreadOnly, limit: 50 })
  }, [showUnreadOnly, fetchNotifications])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === visibleNotifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(visibleNotifications.map(n => n.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length > 0) {
      await deleteSelected(selectedIds)
      setSelectedIds([])
    }
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

  const visibleNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bildirimler</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications({ unreadOnly: showUnreadOnly, limit: 50 })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/notifications/settings")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="unread-only"
                  checked={showUnreadOnly}
                  onCheckedChange={setShowUnreadOnly}
                />
                <Label htmlFor="unread-only">Sadece okunmamışları göster</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Seçilenleri Sil ({selectedIds.length})
                  </Button>
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Tümünü Okundu İşaretle
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    İşlemler
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSelectAll}>
                    {selectedIds.length === visibleNotifications.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={deleteAllRead}
                    className="text-red-600"
                  >
                    Okunmuş Bildirimleri Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Bildirimler yükleniyor...</p>
          </CardContent>
        </Card>
      ) : visibleNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold mb-2">
              {showUnreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
            </h3>
            <p className="text-muted-foreground">
              {showUnreadOnly 
                ? "Tüm bildirimleriniz okundu!" 
                : "Yeni bildirimler buraya gelecek."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.isRead ? "bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : ""
              } ${selectedIds.includes(notification.id) ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, notification.id])
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== notification.id))
                      }
                    }}
                    className="mt-1"
                  />
                  
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getNotificationTypeText(notification.type)}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr
                          })}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-sm leading-tight">
                      {notification.title}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    
                    {notification.creator && (
                      <p className="text-xs text-muted-foreground">
                        {notification.creator.firstName} {notification.creator.lastName}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}