import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"
import { NotificationType } from "@/generated/prisma"

// Kullanıcının bildirimlerini getir
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Okunmamış bildirim sayısı
    const unreadCount = await db.notification.count({
      where: {
        userId,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit
    })

  } catch (error) {
    console.error("Bildirimler getirilirken hata:", error)
    return NextResponse.json(
      { error: "Bildirimler getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Yeni bildirim oluştur
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const createdBy = payload.userId

    const body = await request.json()
    const { 
      userId, 
      title, 
      message, 
      type, 
      entityType, 
      entityId, 
      actionUrl,
      metadata 
    } = body

    // Gerekli alanları kontrol et
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: "userId, title, message ve type alanları zorunludur" },
        { status: 400 }
      )
    }

    // NotificationType enum kontrolü
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "Geçersiz notification type" },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        entityType,
        entityId,
        actionUrl,
        createdBy,
        metadata
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error("Bildirim oluşturulurken hata:", error)
    return NextResponse.json(
      { error: "Bildirim oluşturulurken hata oluştu" },
      { status: 500 }
    )
  }
}