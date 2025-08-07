import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"

// Global Map to track user connections
const connections = new Map<string, ReadableStreamDefaultController<Uint8Array>>()

// Real-time notification stream using Server-Sent Events
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId

    // SSE stream oluştur
    const stream = new ReadableStream({
      start(controller) {
        // Kullanıcı connection'ını sakla
        connections.set(userId, controller)

        // İlk bağlantı mesajı gönder
        const data = JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
          message: "Bildirim akışına bağlandı"
        })
        
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))

        // Heartbeat - bağlantıyı canlı tut (30 saniyede bir)
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n\n`))
          } catch (error) {
            clearInterval(heartbeat)
            connections.delete(userId)
          }
        }, 30000)

        // Connection temizleme
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat)
          connections.delete(userId)
          try {
            controller.close()
          } catch (error) {
            // Controller zaten kapalı olabilir
          }
        })
      },

      cancel() {
        // Stream kapatıldığında temizlik
        connections.delete(userId)
      }
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control"
      }
    })

  } catch (error) {
    console.error("SSE bağlantısı kurulurken hata:", error)
    return NextResponse.json(
      { error: "Bağlantı kurulurken hata oluştu" },
      { status: 500 }
    )
  }
}

// Bildirim gönderme fonksiyonu (diğer API'ler tarafından kullanılacak)
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = connections.get(userId)
  
  if (controller) {
    try {
      const data = JSON.stringify({
        type: "notification",
        timestamp: new Date().toISOString(),
        data: notification
      })
      
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
      return true
    } catch (error) {
      console.error("Bildirim gönderilirken hata:", error)
      connections.delete(userId)
      return false
    }
  }
  
  return false
}

// Okunmamış bildirim sayısını güncelleme
export function sendUnreadCountUpdate(userId: string, unreadCount: number) {
  const controller = connections.get(userId)
  
  if (controller) {
    try {
      const data = JSON.stringify({
        type: "unread_count",
        timestamp: new Date().toISOString(),
        data: { unreadCount }
      })
      
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
      return true
    } catch (error) {
      console.error("Okunmamış sayı gönderilirken hata:", error)
      connections.delete(userId)
      return false
    }
  }
  
  return false
}

// Aktif bağlantıları görmek için (debug amaçlı)
export function getActiveConnections() {
  return Array.from(connections.keys())
}