import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const user = await db.user.findUnique({
      where: {
        id: decoded.userId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { firstName, lastName, email, emailOtp, currentPassword, newPassword } = body

    console.log("Profile update request:", { userId: decoded.userId, firstName, lastName, email, hasEmailOtp: !!emailOtp, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword })

    // Mevcut kullanıcıyı kontrol et
    const existingUser = await db.user.findUnique({
      where: {
        id: decoded.userId
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // E-posta değişikliği varsa kontrol et (OTP doğrulaması verify-otp endpoint'inde yapılır)
    if (email && email !== existingUser.email) {
      // Başka kullanıcı tarafından kullanılıp kullanılmadığını kontrol et
      const emailExists = await db.user.findUnique({
        where: {
          email: email
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: "Bu e-posta adresi zaten kullanümda" }, { status: 409 })
      }
    }

    // Şifre değişikliği varsa doğrula
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Mevcut şifre gerekli" }, { status: 400 })
      }

      const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, existingUser.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 400 })
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Yeni şifre en az 6 karakter olmalıdır" }, { status: 400 })
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {}
    
    if (firstName !== undefined && firstName.trim()) {
      updateData.firstName = firstName.trim()
    }
    
    if (lastName !== undefined && lastName.trim()) {
      updateData.lastName = lastName.trim()
    }
    
    if (email !== undefined && email.trim()) {
      updateData.email = email.trim()
    }
    
    if (newPassword) {
      updateData.password = await bcryptjs.hash(newPassword, 12)
    }

    // Kullanıcıyı güncelle
    const updatedUser = await db.user.update({
      where: {
        id: decoded.userId
      },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}