import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve doğrulama kodu gerekli' },
        { status: 400 }
      )
    }

    // Registration için OTP kontrol et
    let otp = await db.emailOTP.findFirst({
      where: {
        email,
        code,
        type: 'VERIFICATION',
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    // Email değişikliği için OTP kontrol et
    if (!otp) {
      const cookieStore = await cookies()
      const token = cookieStore.get("token")?.value
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
        
        otp = await db.emailOTP.findFirst({
          where: {
            email,
            code,
            type: 'EMAIL_CHANGE',
            used: false,
            userId: decoded.userId,
            expiresAt: {
              gt: new Date()
            }
          }
        })
      }
    }

    if (!otp) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş doğrulama kodu' },
        { status: 400 }
      )
    }

    // OTP'yi kullanılmış olarak işaretle
    await db.emailOTP.update({
      where: { id: otp.id },
      data: { used: true }
    })

    // Registration OTP'si ise email'i doğrulanmış olarak işaretle
    if (otp.type === 'VERIFICATION' && otp.userId) {
      await db.user.update({
        where: { id: otp.userId },
        data: { emailVerified: true }
      })
    }
    
    // Email değişikliği OTP'si ise email'i güncelle
    if (otp.type === 'EMAIL_CHANGE' && otp.userId) {
      await db.user.update({
        where: { id: otp.userId },
        data: { email: email }
      })
    }

    return NextResponse.json({
      message: 'Email adresi başarıyla doğrulandı',
      verified: true
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}