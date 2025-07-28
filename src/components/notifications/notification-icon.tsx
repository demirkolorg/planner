"use client"

import React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationStore } from '@/store/notificationStore'
import { NotificationCenter } from './notification-center'

export function NotificationIcon() {
  const { unreadCount } = useNotificationStore()

  return <NotificationCenter />
}