import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as jose from 'jose'
import { MESSAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userToken } = body

    if (!userToken) {
      return NextResponse.json(
        { error: 'Token gerekli' },
        { status: 400 }
      )
    }

    // Token'ı verify et
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
      const { payload } = await jose.jwtVerify(userToken, secret)
      const userId = payload.userId as string

      // Kullanıcı bilgilerini getir
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Kullanıcı bulunamadı' },
          { status: 404 }
        )
      }

      // Yeni bir token oluştur (token refresh için)
      const newToken = await new jose.SignJWT({ userId: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret)

      const response = NextResponse.json({
        message: 'Hesap değiştirildi',
        user: user
      })

      // Yeni token'ı cookie'ye set et
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 gün
      })

      return response

    } catch (tokenError) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Account switch error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR.SERVER_ERROR },
      { status: 500 }
    )
  }
}