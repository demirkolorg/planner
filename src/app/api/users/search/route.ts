import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jose.jwtVerify(token, secret)
    const userId = payload.userId as string

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Kullanıcı arama - email ve isim bazında
    const users = await db.user.findMany({
      where: {
        AND: [
          {
            NOT: {
              id: userId // Kendi kullanıcısını hariç tut
            }
          },
          {
            OR: [
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                firstName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 10 // Maksimum 10 sonuç
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Kullanıcı arama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}