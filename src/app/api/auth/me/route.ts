import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    const userId = payload.userId

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error("Kullanıcı bilgileri getirilirken hata:", error)
    return NextResponse.json(
      { error: "Kullanıcı bilgileri getirilirken hata oluştu" },
      { status: 500 }
    )
  }
}