// Bu dosya artık Zustand store kullanıyor
// Tüm auth işlemleri için @/store/authStore kullanın

import jwt from 'jsonwebtoken'

export { useAuthStore } from '@/store/authStore'
export type { User } from '@/store/authStore'

// JWT verification utility
export async function verifyJWT(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Verify JWT and check if user exists in database
export async function authenticateUser(token: string) {
  const { db } = await import('@/lib/db')
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Check if user still exists in database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, firstName: true, lastName: true, email: true }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return { userId: payload.userId, user }
  } catch (error) {
    throw new Error('Authentication failed')
  }
}