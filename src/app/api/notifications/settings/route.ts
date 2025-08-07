import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"

// Kullanıcının bildirim ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId

    let settings = await db.notificationSettings.findUnique({
      where: { userId }
    })

    // Ayarlar yoksa varsayılan ayarları oluştur
    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { userId }
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error("Bildirim ayarları getirilirken hata:", error)
    return NextResponse.json(
      { error: "Bildirim ayarları getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Kullanıcının bildirim ayarlarını güncelle
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const body = await request.json()

    // Mevcut ayarları kontrol et
    const existingSettings = await db.notificationSettings.findUnique({
      where: { userId }
    })

    let settings
    if (existingSettings) {
      // Var olan ayarları güncelle
      settings = await db.notificationSettings.update({
        where: { userId },
        data: body
      })
    } else {
      // Yeni ayarlar oluştur
      settings = await db.notificationSettings.create({
        data: {
          userId,
          ...body
        }
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error("Bildirim ayarları güncellenirken hata:", error)
    return NextResponse.json(
      { error: "Bildirim ayarları güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}