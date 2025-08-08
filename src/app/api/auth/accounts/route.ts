import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 })
    }

    // Mevcut kullanıcıyı verify et
    const payload = await verifyJWT(token)
    const currentUserId = payload.userId

    // Mevcut kullanıcı bilgilerini getir (accounts listesi için gerekli)
    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        updatedAt: true
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Client-side stored accounts için gerekli bilgileri döndür
    // Bu endpoint sadece mevcut kullanıcının bilgilerini döndürür
    // Diğer account'lar client-side localStorage'dan gelecek
    return NextResponse.json({
      currentUser: {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        lastUsed: currentUser.updatedAt
      }
    })

  } catch (error) {
    console.error("Accounts fetch error:", error)
    return NextResponse.json(
      { error: "Hesap bilgileri getirilemedi" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      )
    }

    // Bu endpoint client-side cleanup için kullanılacak
    // Server-side'da özel bir işlem yapmayacağız
    // Sadece başarılı response döneceğiz
    
    return NextResponse.json({
      message: 'Hesap kaldırıldı',
      removedUserId: userId
    })

  } catch (error) {
    console.error("Account removal error:", error)
    return NextResponse.json(
      { error: "Hesap kaldırma hatası" },
      { status: 500 }
    )
  }
}