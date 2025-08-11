"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  MessageCircle,
  Activity,
  Send,
  Reply,
  MoreVertical,
  Trash2,
  CheckCircle,
  Edit3,
  Flag,
  Calendar,
  Tag
} from "lucide-react"
import { Card, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/authStore"

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
  replies?: Comment[]
}

interface Activity {
  id: string
  actionType: string
  description: string
  oldValue?: string
  newValue?: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface TaskActivityPanelProps {
  task: any
  onTaskUpdate?: (task: any) => void
}

export function TaskActivityPanel({ task }: TaskActivityPanelProps) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Yorumları yükle
  const fetchComments = useCallback(async () => {
    try {
      setIsLoadingComments(true)
      const response = await fetch(`/api/tasks/${task.id}/comments`)
      
      if (!response.ok) throw new Error('Yorumlar yüklenemedi')

      const data = await response.json()
      setComments(data)
    } catch (error: unknown) {
      console.error('Comments fetch error:', error)
      toast.error('Yorumlar yüklenirken hata oluştu')
    } finally {
      setIsLoadingComments(false)
    }
  }, [task.id])

  // Aktiviteleri yükle
  const fetchActivities = useCallback(async () => {
    try {
      setIsLoadingActivities(true)
      const response = await fetch(`/api/tasks/${task.id}/activities`)
      
      if (!response.ok) throw new Error('Aktiviteler yüklenemedi')

      const data = await response.json()
      setActivities(data)
    } catch (error: unknown) {
      console.error('Activities fetch error:', error)
      toast.error('Aktiviteler yüklenirken hata oluştu')
    } finally {
      setIsLoadingActivities(false)
    }
  }, [task.id])

  useEffect(() => {
    fetchComments()
    fetchActivities()
  }, [task.id, fetchComments, fetchActivities])

  // Yorum gönder
  const handleSendComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return

    try {
      setIsSending(true)
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || undefined
        })
      })

      if (!response.ok) throw new Error('Yorum gönderilemedi')

      await fetchComments()
      
      if (parentId) {
        setReplyTo(null)
        setReplyContent("")
      } else {
        setNewComment("")
      }

      // Yorum listesinin altına kaydır
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

      toast.success('Yorum gönderildi')
    } catch (error: unknown) {
      toast.error('Yorum gönderilirken hata oluştu')
    } finally {
      setIsSending(false)
    }
  }

  // Aktivite ikonu
  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'COMPLETED':
      case 'UNCOMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'TITLE_CHANGED':
      case 'DESCRIPTION_CHANGED':
        return <Edit3 className="h-4 w-4" />
      case 'PRIORITY_CHANGED':
        return <Flag className="h-4 w-4" />
      case 'DUE_DATE_CHANGED':
        return <Calendar className="h-4 w-4" />
      case 'PINNED':
      case 'UNPINNED':
        return <Tag className="h-4 w-4" />
      case 'comment_added':
        return <MessageCircle className="h-4 w-4" />
      case 'comment_deleted':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  // Aktivite rengi
  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'COMPLETED':
        return 'text-green-600'
      case 'UNCOMPLETED':
        return 'text-orange-600'
      case 'TITLE_CHANGED':
      case 'DESCRIPTION_CHANGED':
        return 'text-blue-600'
      case 'PRIORITY_CHANGED':
        return 'text-purple-600'
      case 'DUE_DATE_CHANGED':
        return 'text-amber-600'
      case 'comment_added':
        return 'text-teal-600'
      case 'comment_deleted':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  // Yorum component'i
  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => (
    <div className={cn("space-y-2", isReply && "ml-6")}>
      <div className="flex gap-3">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {comment.user.firstName[0]}{comment.user.lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {comment.user.firstName} {comment.user.lastName}
              </span>
              
              {comment.user.id === user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-6 sm:w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(comment.createdAt), { 
                addSuffix: true, 
                locale: tr 
              })}
            </span>
            
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(comment.id)}
                className="h-6 px-2 text-xs sm:h-5 sm:px-1"
              >
                <Reply className="h-3 w-3 mr-1" />
                Yanıtla
              </Button>
            )}
          </div>

          {/* Yanıt formu */}
          {replyTo === comment.id && (
            <div className="space-y-2 mt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                className="min-h-20 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setReplyTo(null)
                    setReplyContent("")
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSendComment(replyContent, comment.id)}
                  disabled={!replyContent.trim() || isSending}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Gönder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent("")
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}

          {/* Yanıtlar */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-2 mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="h-80 sm:h-96">
        <CardHeader className="pb-3">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Yorumlar ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Aktivite ({activities.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-4">
              <div className="space-y-4">
                {/* Yorumlar Listesi */}
                <ScrollArea className="h-48 sm:h-64">
                  <div className="space-y-4 pr-4">
                    {isLoadingComments ? (
                      <div className="text-center py-4">
                        <div className="text-sm text-muted-foreground">
                          Yorumlar yükleniyor...
                        </div>
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Henüz yorum yok
                        </p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>
                </ScrollArea>

                {/* Yorum Yazma Alanı */}
                <div className="space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yorum yazın..."
                    className="min-h-20 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) {
                        handleSendComment(newComment)
                      }
                    }}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Cmd+Enter ile gönder
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleSendComment(newComment)}
                      disabled={!newComment.trim() || isSending}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Gönder
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ScrollArea className="h-64 sm:h-80">
                <div className="space-y-3 pr-4">
                  {isLoadingActivities ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">
                        Aktiviteler yükleniyor...
                      </div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Henüz aktivite yok
                      </p>
                    </div>
                  ) : (
                    activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center",
                          getActivityColor(activity.actionType)
                        )}>
                          {getActivityIcon(activity.actionType)}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">
                              {activity.user.firstName} {activity.user.lastName}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {activity.description}
                            </span>
                          </div>

                          {(activity.oldValue || activity.newValue) && (
                            <div className="text-xs space-y-1">
                              {activity.oldValue && (
                                <div className="text-muted-foreground">
                                  <span className="text-red-600">Eski:</span> {activity.oldValue}
                                </div>
                              )}
                              {activity.newValue && (
                                <div className="text-muted-foreground">
                                  <span className="text-green-600">Yeni:</span> {activity.newValue}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), { 
                              addSuffix: true, 
                              locale: tr 
                            })}
                          </div>
                        </div>

                        {index < activities.length - 1 && (
                          <div className="absolute left-[11px] top-6 w-0.5 h-6 bg-border" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  )
}