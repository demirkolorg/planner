import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyJWT } from "@/lib/auth"

// Belirli bir bildirimi getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const { id } = await params

    const notification = await db.notification.findFirst({
      where: {
        id,
        userId // Kullanıcı sadece kendi bildirimlerini görebilir
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

    if (!notification) {
      return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(notification)

  } catch (error) {
    console.error("Bildirim getirilirken hata:", error)
    return NextResponse.json(
      { error: "Bildirim getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Bildirimi güncelle (genelde okundu olarak işaretlemek için)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const { id } = await params
    const body = await request.json()

    // Kullanıcının bildirimi olduğunu kontrol et
    const existingNotification = await db.notification.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingNotification) {
      return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 })
    }

    const notification = await db.notification.update({
      where: { id },
      data: body,
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

    return NextResponse.json(notification)

  } catch (error) {
    console.error("Bildirim güncellenirken hata:", error)
    return NextResponse.json(
      { error: "Bildirim güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// Bildirimi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId
    const { id } = await params

    // Kullanıcının bildirimi olduğunu kontrol et
    const existingNotification = await db.notification.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingNotification) {
      return NextResponse.json({ error: "Bildirim bulunamadı" }, { status: 404 })
    }

    await db.notification.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Bildirim silindi" })

  } catch (error) {
    console.error("Bildirim silinirken hata:", error)
    return NextResponse.json(
      { error: "Bildirim silinirken hata oluştu" },
      { status: 500 }
    )
  }
}