import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/terms', '/privacy']
  
  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/send-otp', '/api/auth/send-email-otp', '/api/auth/verify-otp']

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname)
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  
  // Static files and Next.js internals - skip auth check
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/_next') || 
      pathname.includes('.') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Skip auth check for public routes
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('token')?.value

  if (!token) {
    // Redirect to login if no token and trying to access protected route
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verify JWT token
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set')
      throw new Error('JWT_SECRET not configured')
    }
    
    // Token format kontrolü
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Invalid token format')
    }
    
    // JWT token doğrulama - Edge runtime uyumlu
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    
    // Token geçerliyse devam et
    return NextResponse.next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    
    // Geçersiz token - cookie'yi temizle ve yönlendir
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ 
        error: 'Oturum geçersiz', 
        message: 'Lütfen tekrar giriş yapınız' 
      }, { status: 401 })
      response.cookies.set('token', '', { 
        httpOnly: true, 
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      })
      return response
    }
    
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('token', '', { 
      httpOnly: true, 
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    })
    return response
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}