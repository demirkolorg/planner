import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"

// Toplu bildirim işlemleri
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const body = await request.json()
    const { action, notificationIds } = body

    if (!action) {
      return NextResponse.json(
        { error: "Action alanı zorunludur" },
        { status: 400 }
      )
    }

    let result
    
    switch (action) {
      case "mark_all_read":
        // Tüm bildirimleri okundu olarak işaretle
        result = await db.notification.updateMany({
          where: {
            userId,
            isRead: false
          },
          data: {
            isRead: true
          }
        })
        break

      case "mark_selected_read":
        // Seçilen bildirimleri okundu olarak işaretle
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: "notificationIds dizi olarak gönderilmelidir" },
            { status: 400 }
          )
        }
        
        result = await db.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId // Güvenlik için kullanıcı kontrolü
          },
          data: {
            isRead: true
          }
        })
        break

      case "delete_selected":
        // Seçilen bildirimleri sil
        if (!notificationIds || !Array.isArray(notificationIds)) {
          return NextResponse.json(
            { error: "notificationIds dizi olarak gönderilmelidir" },
            { status: 400 }
          )
        }
        
        result = await db.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId // Güvenlik için kullanıcı kontrolü
          }
        })
        break

      case "delete_all_read":
        // Tüm okunmuş bildirimleri sil
        result = await db.notification.deleteMany({
          where: {
            userId,
            isRead: true
          }
        })
        break

      default:
        return NextResponse.json(
          { error: "Geçersiz action" },
          { status: 400 }
        )
    }

    // Güncel okunmamış sayısını hesapla
    const unreadCount = await db.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return NextResponse.json({
      message: "İşlem başarılı",
      affected: result.count,
      unreadCount
    })

  } catch (error) {
    console.error("Toplu bildirim işlemi sırasında hata:", error)
    return NextResponse.json(
      { error: "İşlem sırasında hata oluştu" },
      { status: 500 }
    )
  }
}