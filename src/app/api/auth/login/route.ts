import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { VALIDATION, MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    // Başarılı login - şifreyi response'tan çıkar
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: MESSAGES.SUCCESS.LOGIN,
        user: userWithoutPassword
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login hatası:', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR.SERVER_ERROR },
      { status: 500 }
    );
  }
}