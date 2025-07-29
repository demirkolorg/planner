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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // OAuth2 code'u token'lara çevir
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/settings?error=token_error', request.url)
      )
    }

    // Google Account ID al
    oauth2Client.setCredentials(tokens)
    const { google } = require('googleapis')
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()

    // Veritabanına kaydet veya güncelle
    await db.googleCalendarIntegration.upsert({
      where: { userId },
      update: {
        googleAccountId: userInfo.data.id!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        calendarId: 'primary', // Varsayılan takvim
        syncEnabled: true,
        lastSyncAt: null,
      },
      create: {
        userId,
        googleAccountId: userInfo.data.id!,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        calendarId: 'primary',
        syncEnabled: true,
      },
    })

    return NextResponse.redirect(
      new URL('/settings?success=calendar_connected', request.url)
    )

  } catch (error) {
    return NextResponse.redirect(
      new URL('/settings?error=connection_failed', request.url)
    )
  }
}