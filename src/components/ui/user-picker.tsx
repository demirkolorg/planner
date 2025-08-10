"use client"

import React, { useState, useEffect } from 'react'
import { Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface UserPickerProps {
  selectedUsers?: User[]
  selectedUserIds?: string[]
  onSelectionChange?: (users: User[]) => void
  onSelectionChangeIds?: (userIds: string[]) => void
  placeholder?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
  trigger?: React.ReactNode
  projectId?: string
}

export function UserPicker({
  selectedUsers = [],
  selectedUserIds = [],
  onSelectionChange,
  onSelectionChangeIds,
  placeholder = "Kullanıcı ara...",
  multiple = true,
  disabled = false,
  className,
  trigger,
  projectId
}: UserPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([]) // selectedUserIds için kullanıcı verilerini cache'le

  // Current user'ı al
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/profile')
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.id || null)
        }
      } catch (error) {
        console.error('Current user fetch error:', error)
      }
    }
    
    fetchCurrentUser()
  }, [])

  // Kullanıcı arama
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const searchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          const users = data.users || []
          setSearchResults(users)
          // Cache'e ekle
          setAllUsers(prev => {
            const newUsers = users.filter(user => !prev.some(p => p.id === user.id))
            return [...prev, ...newUsers]
          })
        }
      } catch (error) {
        console.error('User search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Proje üyelerini getir
  useEffect(() => {
    if (projectId && isOpen) {
      const fetchProjectMembers = async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/members`)
          if (response.ok) {
            const data = await response.json()
            const members = data.members?.map((member: any) => member.user) || []
            setProjectMembers(members)
            // Cache'e ekle
            setAllUsers(prev => {
              const newUsers = members.filter(user => !prev.some(p => p.id === user.id))
              return [...prev, ...newUsers]
            })
          }
        } catch (error) {
          console.error('Project members fetch error:', error)
        }
      }
      
      fetchProjectMembers()
    }
  }, [projectId, isOpen])
  
  // selectedUserIds için user verilerini fetch et
  useEffect(() => {
    if (selectedUserIds.length > 0 && onSelectionChangeIds) {
      const missingUserIds = selectedUserIds.filter(id => !allUsers.some(user => user.id === id))
      if (missingUserIds.length > 0) {
        // Bu kullanıcıları fetch etmek için API çağrısı yapabiliriz
        // Şimdilik basit bir search yaparak çözebiliriz
        const fetchMissingUsers = async () => {
          try {
            // Her eksik ID için mini search yap
            for (const userId of missingUserIds) {
              const response = await fetch(`/api/users/search?id=${userId}`)
              if (response.ok) {
                const data = await response.json()
                const user = data.user
                if (user && !allUsers.some(u => u.id === user.id)) {
                  setAllUsers(prev => [...prev, user])
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch selected user data:', error)
          }
        }
        fetchMissingUsers()
      }
    }
  }, [selectedUserIds, allUsers, onSelectionChangeIds])

  // Kullanıcı seçimi
  const handleUserSelect = (user: User) => {
    if (onSelectionChangeIds) {
      // ID-based callback kullan
      if (multiple) {
        const isSelected = selectedUserIds.includes(user.id)
        if (!isSelected) {
          onSelectionChangeIds([...selectedUserIds, user.id])
        }
      } else {
        onSelectionChangeIds([user.id])
        setIsOpen(false)
      }
    } else if (onSelectionChange) {
      // User object callback kullan
      if (multiple) {
        const isSelected = selectedUsers.some(u => u.id === user.id)
        if (!isSelected) {
          onSelectionChange([...selectedUsers, user])
        }
      } else {
        onSelectionChange([user])
        setIsOpen(false)
      }
    }
    setSearchQuery('')
  }

  // Kullanıcı kaldırma
  const handleUserRemove = (userId: string) => {
    if (onSelectionChangeIds) {
      onSelectionChangeIds(selectedUserIds.filter(id => id !== userId))
    } else if (onSelectionChange) {
      onSelectionChange(selectedUsers.filter(u => u.id !== userId))
    }
  }

  // Gösterilecek kullanıcıları belirle
  const getDisplayUsers = () => {
    if (projectId && projectMembers.length > 0 && searchQuery.length < 2) {
      // Proje üyelerini filtrele - kendini hariç tut (sadece arama yoksa)
      return projectMembers.filter(user => user.id !== currentUserId)
    }
    // Normal arama sonuçları veya proje varsa ama arama metni yazılmışsa (API zaten kendini hariç tutuyor)
    return searchResults
  }

  // Kullanıcının adı soyadı baş harflerini al
  const getUserInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }

  // Kullanıcının tam adını al
  const getUserFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`
  }

  const displayUsers = getDisplayUsers()
  
  // selectedUserIds'den actual user objeleri çıkar
  const getSelectedUserObjects = (): User[] => {
    if (selectedUserIds.length === 0) return selectedUsers
    return selectedUserIds.map(id => allUsers.find(user => user.id === id)).filter(Boolean) as User[]
  }
  
  const actualSelectedUsers = onSelectionChangeIds ? getSelectedUserObjects() : selectedUsers

  // Popover content'i oluştur
  const popoverContent = (
    <PopoverContent className="w-80 p-0" align="start">
      {/* Seçili kullanıcılar - sadece 1'den fazla varsa göster */}
      {actualSelectedUsers.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Seçilen Kişiler ({actualSelectedUsers.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {actualSelectedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1 text-xs"
              >
                <Avatar className="h-3 w-3">
                  <AvatarFallback className="text-[8px]">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <span>{user.firstName}</span>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleUserRemove(user.id)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Arama inputu */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>
      </div>

      {/* Kullanıcı listesi */}
      <div className="max-h-60 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aranıyor...
          </div>
        ) : (!projectId && searchQuery.length < 2) ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aramak için en az 2 karakter yazın
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {projectId ? "Proje üyesi bulunamadı" : "Kullanıcı bulunamadı"}
          </div>
        ) : (
          <div className="p-2">
            {displayUsers.map((user) => {
              const isSelected = onSelectionChangeIds 
                ? selectedUserIds.includes(user.id)
                : actualSelectedUsers.some(u => u.id === user.id)
              return (
                <Button
                  key={user.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-2 h-auto",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => !isSelected && handleUserSelect(user)}
                  disabled={isSelected}
                >
                  <Avatar className="h-8 w-8 mr-3">
                    <AvatarFallback className="text-sm font-medium">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">
                      {getUserFullName(user)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Seçili
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </PopoverContent>
  )

  // Trigger varsa sadece popover'ı render et
  if (trigger) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    )
  }

  // Eski davranış: Trigger yoksa tam widget'ı render et
  return (
    <div className={cn("space-y-2", className)}>
      {/* Seçili kullanıcılar */}
      {actualSelectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actualSelectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-2 pr-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-xs font-medium">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{getUserFullName(user)}</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleUserRemove(user.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Kullanıcı seçim popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left font-normal"
          >
            <Users className="mr-2 h-4 w-4" />
            {actualSelectedUsers.length > 0
              ? multiple 
                ? `${actualSelectedUsers.length} kullanıcı seçildi`
                : getUserFullName(actualSelectedUsers[0])
              : placeholder
            }
          </Button>
        </PopoverTrigger>
        {popoverContent}
      </Popover>
    </div>
  )
}