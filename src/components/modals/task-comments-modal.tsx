"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MessageCircle, 
  Send, 
  Reply, 
  Trash2, 
  MoreVertical
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

interface Comment {
  id: string
  content: string
  taskId: string
  userId: string
  parentId?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  replies?: Comment[]
  _count?: {
    replies: number
  }
}

interface TaskCommentsModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  taskTitle: string
}

export function TaskCommentsModal({ isOpen, onClose, taskId, taskTitle }: TaskCommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContents, setReplyContents] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuthStore()
  const replyTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  // Yorumları yükle
  const fetchComments = useCallback(async () => {
    if (!taskId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  // Yeni yorum gönder
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment("")
      } else {
        console.error("Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Yanıt gönder
  const handleSubmitReply = async (parentId: string) => {
    const replyContent = replyContents[parentId] || ""
    if (!replyContent.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (response.ok) {
        const reply = await response.json()
        
        // Yorumu güncelle - replies'a ekle
        setComments(prev => 
          prev.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [reply, ...(comment.replies || [])],
                _count: {
                  ...comment._count,
                  replies: (comment._count?.replies || 0) + 1
                }
              }
            }
            return comment
          })
        )
        
        // Bu comment için reply content'i temizle
        setReplyContents(prev => ({
          ...prev,
          [parentId]: ""
        }))
        setReplyingTo(null)
      } else {
        console.error("Failed to add reply")
      }
    } catch (error) {
      console.error("Error adding reply:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Yorum sil
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Yorumu listeden kaldır
        setComments(prev => prev.filter(comment => comment.id !== commentId))
      } else {
        console.error("Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  // Modal açıldığında yorumları yükle
  useEffect(() => {
    if (isOpen && taskId) {
      fetchComments()
      // Modal açıldığında reply state'leri temizle
      setReplyContents({})
      setReplyingTo(null)
    }
  }, [isOpen, taskId, fetchComments])

  // Reply textarea focus yönetimi
  useEffect(() => {
    if (replyingTo && replyTextareaRefs.current[replyingTo]) {
      const textarea = replyTextareaRefs.current[replyingTo]
      if (textarea) {
        // Kısa bir gecikme ile focus ver
        setTimeout(() => {
          textarea.focus()
          // Cursor'u en sona taşı
          const length = textarea.value.length
          textarea.setSelectionRange(length, length)
        }, 100)
      }
    }
  }, [replyingTo, replyContents])

  // Reply content güncelleme fonksiyonu
  const updateReplyContent = useCallback((commentId: string, content: string) => {
    setReplyContents(prev => {
      if (prev[commentId] === content) return prev
      return {
        ...prev,
        [commentId]: content
      }
    })
  }, [])

  // Kullanıcının baş harflerini al
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Tarih formatlama
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: tr 
      })
    } catch {
      return "bilinmeyen zaman"
    }
  }

  // Yorum bileşeni
  const CommentItem = memo(({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [showReplies, setShowReplies] = useState(false)
    const isOwner = user?.id === comment.user.id
    
    const setRef = useCallback((el: HTMLTextAreaElement | null) => {
      if (el) {
        replyTextareaRefs.current[comment.id] = el
      } else {
        delete replyTextareaRefs.current[comment.id]
      }
    }, [comment.id])

    return (
      <div className={cn("space-y-3", isReply && "ml-12")}>
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getUserInitials(comment.user.firstName, comment.user.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.user.firstName} {comment.user.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <p className="text-sm text-foreground leading-relaxed">
                {comment.content}
              </p>
            </div>
            
            {!isReply && (
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Reply className="h-3 w-3" />
                  Yanıtla
                </button>
                
                {comment._count && comment._count.replies > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {comment._count.replies} yanıt {showReplies ? 'gizle' : 'göster'}
                  </button>
                )}
              </div>
            )}
            
            {replyingTo === comment.id && (
              <div className="flex gap-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-blue-600 text-white">
                    {user ? getUserInitials(user.firstName, user.lastName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    ref={setRef}
                    placeholder="Yanıtınızı yazın..."
                    value={replyContents[comment.id] || ""}
                    onChange={(e) => updateReplyContent(comment.id, e.target.value)}
                    className="min-h-[60px] resize-none"
                    autoFocus
                    onFocus={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!(replyContents[comment.id] || "").trim() || isSubmitting}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Yanıtla
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContents(prev => ({
                          ...prev,
                          [comment.id]: ""
                        }))
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <div className="flex flex-col">
              <span>Yorumlar</span>
              <span className="text-sm font-normal text-muted-foreground">
                {taskTitle}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Yeni yorum ekleme */}
        <div className="flex-shrink-0 space-y-3 p-1">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                {user ? getUserInitials(user.firstName, user.lastName) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Yorumunuzu yazın..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Gönder
                </Button>
              </div>
            </div>
          </div>
          <Separator />
        </div>

        {/* Yorumlar listesi */}
        <div className="flex-1 overflow-y-auto px-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Yorumlar yükleniyor...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">Henüz yorum yok</h3>
              <p className="text-sm text-muted-foreground">
                Bu göreve ilk yorumu sen ekle!
              </p>
            </div>
          ) : (
            <div className="space-y-6 py-4 pb-8">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}