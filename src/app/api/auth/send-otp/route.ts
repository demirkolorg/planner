import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateOTP, sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email adresi gerekli' },
        { status: 400 }
      )
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçersiz email adresi' },
        { status: 400 }
      )
    }

    // Kullanıcının zaten kayıtlı olup olmadığını kontrol et
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kayıtlı ve doğrulanmış' },
        { status: 400 }
      )
    }

    // Mevcut aktif OTP'leri sil
    await db.emailOTP.updateMany({
      where: {
        email,
        type: 'VERIFICATION',
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        used: true
      }
    })

    // Yeni OTP oluştur
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 dakika

    // OTP'yi veritabanına kaydet
    await db.emailOTP.create({
      data: {
        email,
        code: otpCode,
        type: 'VERIFICATION',
        expiresAt,
        userId: existingUser?.id
      }
    })

    // Email gönder
    const emailSent = await sendVerificationEmail(email, otpCode, firstName)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Email gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Doğrulama kodu email adresinize gönderildi',
      expiresAt: expiresAt.toISOString()
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}