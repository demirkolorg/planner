"use client"

import { useState } from 'react'
import { 
  User, 
  Plus, 
  MoreVertical, 
  LogOut, 
  X,
  Check 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore, SavedAccount } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AccountSwitcherProps {
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}

export function AccountSwitcher({ className, align = "end", side = "bottom" }: AccountSwitcherProps) {
  const router = useRouter()
  const { 
    user: currentUser, 
    savedAccounts, 
    switchAccount, 
    removeAccount,
    logout
  } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  if (!currentUser) return null

  const handleAccountSwitch = async (userId: string) => {
    console.log('handleAccountSwitch called with:', { userId, currentUserId: currentUser.id })
    
    if (userId === currentUser.id) {
      console.log('Skipping switch to current user')
      return
    }
    
    setIsLoading(true)
    try {
      const success = await switchAccount(userId)
      if (success) {
        toast.success('Hesap değiştirildi')
        // Sayfa reload işlemi
        window.location.reload()
      } else {
        toast.error('Hesap değiştirme başarısız')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Account switch error:', error)
      toast.error('Hesap değiştirme hatası')
      setIsLoading(false)
    }
    // setIsLoading(false) kaldırıldı çünkü sayfa reload olacak
  }

  const handleRemoveAccount = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (userId === currentUser.id) {
      toast.error('Aktif hesabı kaldıramazsınız')
      return
    }
    
    removeAccount(userId)
    toast.success('Hesap kaldırıldı')
  }

  const handleAddAccount = () => {
    router.push('/login?addAccount=true')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Mevcut kullanıcıyı da dahil et
  const allAccounts: (SavedAccount & { isCurrent?: boolean })[] = [
    // Aktif kullanıcıyı en üste koy
    {
      userId: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      token: '', // Aktif hesap için token'a gerek yok
      lastUsed: new Date().toISOString(),
      isCurrent: true
    },
    // Diğer kayıtlı hesapları ekle (aktif olanı hariç tut)
    ...savedAccounts.filter(acc => acc.userId !== currentUser.id)
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn("flex items-center gap-2 h-auto p-2", className)}
          disabled={isLoading}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(currentUser.firstName, currentUser.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">
              {currentUser.firstName} {currentUser.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentUser.email}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} side={side} className="w-80">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Hesaplar</p>
          <p className="text-xs text-muted-foreground">
            {allAccounts.length} hesap kullanılabilir
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Hesap Listesi */}
        <div className="max-h-60 overflow-y-auto">
          {allAccounts.map((account) => (
            <DropdownMenuItem
              key={account.userId}
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => handleAccountSwitch(account.userId)}
              disabled={isLoading}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-sm">
                  {getInitials(account.firstName, account.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {account.firstName} {account.lastName}
                  </p>
                  {account.isCurrent && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {account.email}
                </p>
                {!account.isCurrent && (
                  <p className="text-xs text-muted-foreground">
                    Son kullanım: {new Date(account.lastUsed).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
              
              {/* Remove Account Button */}
              {!account.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleRemoveAccount(account.userId, e)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </DropdownMenuItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Hesap Ekleme */}
        <DropdownMenuItem onClick={handleAddAccount} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Hesap Ekle
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Çıkış */}
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoading}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Tüm Hesaplardan Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}