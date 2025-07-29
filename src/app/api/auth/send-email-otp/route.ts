import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { generateOTP, sendVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      console.log("No token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { newEmail } = body

    console.log("Send OTP request:", { userId: decoded.userId, newEmail })

    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json({ error: "Email adresi gerekli" }, { status: 400 })
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      return NextResponse.json({ error: "Geçersiz email formatı" }, { status: 400 })
    }

    // Mevcut kullanıcının kendi email'i değilse, başka biri tarafından kullanılıp kullanılmadığını kontrol et
    const currentUser = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    if (newEmail.trim() !== currentUser.email) {
      const existingUser = await db.user.findUnique({
        where: { email: newEmail.trim() }
      })

      if (existingUser) {
        return NextResponse.json({ error: "Bu email adresi zaten kullanımda" }, { status: 409 })
      }
    }

    // Mevcut aktif OTP'leri sil
    await db.emailOTP.updateMany({
      where: {
        email: newEmail.trim(),
        type: 'EMAIL_CHANGE',
        used: false,
        expiresAt: {
          gt: new Date()
        }
      },
      data: {
        used: true
      }
    })

    // OTP oluştur
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 dakika

    // OTP'yi veritabanına kaydet
    await db.emailOTP.create({
      data: {
        email: newEmail.trim(),
        code: otp,
        type: 'EMAIL_CHANGE',
        expiresAt,
        userId: decoded.userId
      }
    })

    // Email gönder
    const emailSent = await sendVerificationEmail(newEmail.trim(), otp, currentUser.firstName)

    if (!emailSent) {
      return NextResponse.json({ error: "Email gönderilemedi" }, { status: 500 })
    }

    return NextResponse.json({ message: "OTP gönderildi" })

  } catch (error) {
    console.error("OTP gönderme hatası:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}