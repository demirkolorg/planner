"use client"

import { useState, useEffect } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const user = await response.json()
          setCurrentUser(user)
        } else {
          setCurrentUser(null)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
        setCurrentUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  return { currentUser, isLoading }
}