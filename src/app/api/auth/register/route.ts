import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { VALIDATION, MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Gerekli alanların kontrolü
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.REQUIRED_FIELDS },
        { status: 400 }
      );
    }

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.PASSWORD_TOO_SHORT },
        { status: 400 }
      );
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.INVALID_EMAIL },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: MESSAGES.ERROR.EMAIL_ALREADY_EXISTS },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Kullanıcı ve default proje/bölüm oluşturma işlemini transaction ile yapıyoruz
    const result = await db.$transaction(async (tx) => {
      // Kullanıcıyı oluştur
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
        },
      });

      // Default "Gelen Kutusu" projesini oluştur
      const defaultProject = await tx.project.create({
        data: {
          name: "Gelen Kutusu",
          emoji: "📥",
          userId: user.id,
        },
      });

      // Default "Genel" bölümünü oluştur
      await tx.section.create({
        data: {
          name: "Genel",
          projectId: defaultProject.id,
          order: 0,
        },
      });

      return user;
    });

    return NextResponse.json(
      { 
        message: MESSAGES.SUCCESS.REGISTER,
        user: { 
          id: result.id, 
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email 
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Kayıt hatası:', error);
    return NextResponse.json(
      { error: MESSAGES.ERROR.SERVER_ERROR },
      { status: 500 }
    );
  }
}