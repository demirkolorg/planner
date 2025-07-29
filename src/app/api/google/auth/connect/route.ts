import { NextRequest, NextResponse } from 'next/server'
import { createOAuth2Client, GOOGLE_CALENDAR_SCOPES } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const oauth2Client = createOAuth2Client()
    
    // OAuth2 authorization URL oluştur
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
      prompt: 'consent', // Refresh token almak için
    })

    return NextResponse.json({
      success: true,
      authUrl
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'OAuth2 URL oluşturma hatası' },
      { status: 500 }
    )
  }
}