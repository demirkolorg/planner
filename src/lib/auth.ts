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