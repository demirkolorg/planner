import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // JWT token'ı cookie'den sil
    cookieStore.delete('token')
    
    const response = NextResponse.json({ 
      message: 'Başarıyla çıkış yapıldı' 
    })
    
    // Cookie'yi response'da da sil
    response.cookies.delete('token')
    
    return response
  } catch (error) {
    console.error('Logout hatası:', error)
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}