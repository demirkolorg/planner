"use client"

import React, { useState } from "react"
import { UserPlus, UserMinus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UserPicker } from "@/components/ui/user-picker"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// Toast için geçici console.log - sonra toast eklenecek

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AssignedTask {
  id: string
  title: string
  projectId?: string
  assignments?: Array<{
    id: string
    assigneeId: string
    assignedBy: string
    assignedAt: string
    assignee: User
    assigner: User
  }>
}

interface AssignmentDropdownProps {
  task: AssignedTask
  onAssignUser?: (taskId: string, userId: string) => void
  onUnassignUser?: (taskId: string, userId: string) => void
  onUpdateAssignment?: (taskId: string, userId: string | null) => void
  isTaskCompleted: boolean
}

export function AssignmentDropdown({
  task,
  onAssignUser,
  onUnassignUser,
  onUpdateAssignment,
  isTaskCompleted
}: AssignmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)


  // Şu anda atanmış kullanıcılar
  const assignedUsers = task.assignments?.map(a => a.assignee) || []

  // Kullanıcı atama (tek kişi)
  const handleAssignUser = async (users: User[]) => {
    if (users.length === 0) return

    setIsAssigning(true)
    try {
      const user = users[0] // Tek kişi seçimi
      
      // Önce onUpdateAssignment varsa onu kullan, yoksa eski yöntemi kullan
      if (onUpdateAssignment) {
        await onUpdateAssignment(task.id, user.id)
      } else if (onAssignUser) {
        await assignUser(user.id)
      }

      setIsOpen(false)

      console.log(`${user.firstName} ${user.lastName} göreve atandı`)
    } catch (error) {
      console.error('Assignment error:', error)
      console.error("Atama sırasında hata oluştu")
    } finally {
      setIsAssigning(false)
    }
  }

  // Kullanıcı atamayı kaldırma
  const handleUnassignUser = async (userId: string) => {
    try {
      // Önce onUpdateAssignment varsa onu kullan, yoksa eski yöntemi kullan
      if (onUpdateAssignment) {
        await onUpdateAssignment(task.id, null)
      } else if (onUnassignUser) {
        await unassignUser(userId)
      }
      
      const user = assignedUsers.find(u => u.id === userId)
      console.log(`${user?.firstName} ${user?.lastName} görevden çıkarıldı`)
    } catch (error) {
      console.error('Unassignment error:', error)
      console.error("Atamayı kaldırırken hata oluştu")
    }
  }

  // API çağrıları
  const assignUser = async (userId: string) => {
    const response = await fetch(`/api/tasks/${task.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: userId })
    })

    if (!response.ok) {
      throw new Error('Assignment failed')
    }

    onAssignUser?.(task.id, userId)
  }

  const unassignUser = async (userId: string) => {
    const response = await fetch(`/api/tasks/${task.id}/assign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Unassignment failed')
    }

    onUnassignUser?.(task.id, userId)
  }


  // Debug için basit test butonu - sadece ilk render'da
  React.useEffect(() => {
    console.log('AssignmentDropdown mounted:', { 
      taskId: task.id, 
      assignedUsers: assignedUsers.length, 
      isTaskCompleted,
      hasCallbacks: !!onAssignUser || !!onUpdateAssignment 
    })
  }, [])

  return (
    <DropdownMenu 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('Dropdown state changing to:', open, 'Current state:', isOpen)
        setIsOpen(open)
        
        if (open) {
          console.log('Dropdown açıldı - içerik gösteriliyor')
        } else {
          console.log('Dropdown kapandı')
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 relative"
              disabled={isTaskCompleted}
            >
              {assignedUsers.length > 0 ? (
                <Users className="h-3 w-3" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
              {assignedUsers.length > 0 && (
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background"
                  style={{ backgroundColor: '#3b82f6' }}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isTaskCompleted 
              ? 'Tamamlanmış görevde düzenleme yapılamaz' 
              : assignedUsers.length > 0 
                ? `${assignedUsers[0]?.firstName} ${assignedUsers[0]?.lastName} atanmış - Değiştir`
                : 'Kullanıcı ata'
            }
          </p>
        </TooltipContent>
      </Tooltip>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* User Assignment Menu Item */}
        {(onAssignUser || onUpdateAssignment) && (
          <div className="p-0">
            <UserPicker
              selectedUsers={assignedUsers}
              onSelectionChange={handleAssignUser}
              projectId={task.projectId}
              placeholder="Kullanıcı ara..."
              multiple={false}
              disabled={isAssigning}
              trigger={
                <div 
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    console.log('AssignmentDropdown trigger clicked!')
                  }}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>{assignedUsers.length > 0 ? 'Kullanıcıyı Değiştir' : 'Kullanıcı Ata'}</span>
                  </div>
                </div>
              }
            />
          </div>
        )}

        {assignedUsers.length === 0 && !onAssignUser && !onUpdateAssignment && (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Bu göreve henüz kimse atanmamış
          </div>
        )}

        {assignedUsers.length > 0 && (
          <>
            {(onAssignUser || onUpdateAssignment) && <DropdownMenuSeparator />}
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Atanmış Kullanıcı:
              </p>
            </div>
            
            {assignedUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={(onUnassignUser || onUpdateAssignment) ? () => handleUnassignUser(user.id) : undefined}
                className={`flex items-center justify-between py-2 ${(!onUnassignUser && !onUpdateAssignment) ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                {(onUnassignUser || onUpdateAssignment) && (
                  <UserMinus className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}