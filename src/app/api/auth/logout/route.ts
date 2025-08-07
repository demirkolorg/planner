import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ 
      message: 'Başarıyla çıkış yapıldı' 
    })
    
    // Cookie'yi temizle
    response.cookies.set('token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    return response
  } catch (error) {
    console.error('Logout hatası:', error)
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}