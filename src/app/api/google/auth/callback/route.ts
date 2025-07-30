import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client } from '@/lib/google-calendar'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL('/settings?error=oauth_cancelled', request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=oauth_invalid', request.url)
      )
    }

    // JWT token'dan user ID al
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      )
    }

    let decoded: { userId: string }
    let userId: string
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
      
      if (!userId) {
        throw new Error('User ID not found in token')
      }
      
      console.log('✅ JWT token doğrulandı, User ID:', userId)
    } catch (jwtError) {
      console.error('❌ JWT token doğrulama hatası:', jwtError)
      return NextResponse.redirect(
        new URL('/login?error=invalid_session', request.url)
      )
    }

    // OAuth2 code'u token'lara çevir
    const oauth2Client = createOAuth2Client()
    let tokens: any
    
    try {
      const tokenResponse = await oauth2Client.getToken(code)
      tokens = tokenResponse.tokens
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Access token or refresh token missing')
      }
      
      console.log('✅ OAuth tokens alındı')
    } catch (tokenError) {
      console.error('❌ OAuth token alma hatası:', tokenError)
      return NextResponse.redirect(
        new URL('/settings?error=token_error', request.url)
      )
    }

    // Google Account ID al
    oauth2Client.setCredentials(tokens)
    const { google } = require('googleapis')
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    // Mevcut Planner Takvimi var mı kontrol et
    let existingPlannerCalendarId: string | null = null
    try {
      const { findPlannerCalendarByName } = await import('@/lib/google-calendar')
      oauth2Client.setCredentials(tokens)
      existingPlannerCalendarId = await findPlannerCalendarByName(tokens.access_token)
      console.log('🔍 Planner Takvimi kontrol sonucu:', existingPlannerCalendarId ? 'Bulundu' : 'Bulunamadı')
    } catch (calendarError) {
      console.error('⚠️ Planner Takvimi kontrol hatası:', calendarError)
      // Hata olsa da devam et, sadece null olarak işaretle
      existingPlannerCalendarId = null
    }

    // Veritabanına kaydet veya güncelle
    await db.googleCalendarIntegration.upsert({
      where: { userId },
      update: {
        googleAccountId: userInfo.data.id!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        // Yeni alanlar
        plannerCalendarId: existingPlannerCalendarId,
        plannerCalendarCreated: !!existingPlannerCalendarId,
        readOnlyCalendarIds: [], // Başlangıçta boş
        syncEnabled: true,
        lastSyncAt: null,
        // Backward compatibility için eski alan
        calendarIds: ['primary'],
      },
      create: {
        userId,
        googleAccountId: userInfo.data.id!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        // Yeni alanlar
        plannerCalendarId: existingPlannerCalendarId,
        plannerCalendarCreated: !!existingPlannerCalendarId,
        readOnlyCalendarIds: [], // Başlangıçta boş
        syncEnabled: true,
        // Backward compatibility için eski alan
        calendarIds: ['primary'],
      },
    })

    const message = existingPlannerCalendarId 
      ? 'calendar_connected_existing' 
      : 'calendar_connected_new'

    return NextResponse.redirect(
      new URL(`/settings?success=${message}`, request.url)
    )

  } catch (error) {
    console.error('❌ OAuth callback genel hatası:', error)
    
    // Hata türüne göre farklı mesajlar
    let errorType = 'connection_failed'
    if (error.message?.includes('jwt')) {
      errorType = 'token_invalid'
    } else if (error.message?.includes('database') || error.message?.includes('prisma')) {
      errorType = 'database_error'
    }
    
    return NextResponse.redirect(
      new URL(`/settings?error=${errorType}`, request.url)
    )
  }
}