import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { VALIDATION, MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Multi-account support için query parameter kontrolü
    const url = new URL(request.url);
    const isAddingAccount = url.searchParams.get('addAccount') === 'true';

    // Gerekli alanların kontrolü
    if (!email || !password) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.REQUIRED_FIELDS },
        { status: 400 }
      );
    }

    // Email format kontrolü
    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.INVALID_EMAIL },
        { status: 400 }
      );
    }

    // Kullanıcıyı veritabanından bul
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.USER_NOT_FOUND },
        { status: 401 }
      );
    }

    // Şifre doğrulama
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.WRONG_PASSWORD },
        { status: 401 }
      );
    }

    // JWT token oluştur - Edge runtime uyumlu
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret)

    // Başarılı login - şifreyi response'tan çıkar
    const { password: _, ...userWithoutPassword } = user;

    // Cookie'ye token'ı kaydet
    const response = NextResponse.json(
      { 
        message: isAddingAccount ? 'Hesap eklendi' : MESSAGES.SUCCESS.LOGIN,
        user: {
          ...userWithoutPassword,
          createdAt: user.createdAt?.toISOString ? user.createdAt.toISOString() : user.createdAt,
          updatedAt: user.updatedAt?.toISOString ? user.updatedAt.toISOString() : user.updatedAt,
        },
        token: token, // Multi-account için client-side storage
        isAddingAccount
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 gün
    });

    return response;

  } catch (error) {
    console.error('Login hatası:', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR.SERVER_ERROR },
      { status: 500 }
    );
  }
}