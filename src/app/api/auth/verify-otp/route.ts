import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve doğrulama kodu gerekli' },
        { status: 400 }
      )
    }

    // OTP'yi kontrol et
    const otp = await db.emailOTP.findFirst({
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

    // Eğer kullanıcı varsa email'ini doğrulanmış olarak işaretle
    if (otp.userId) {
      await db.user.update({
        where: { id: otp.userId },
        data: { emailVerified: true }
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