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

    // Email doğrulanmış mı kontrol et
    const validOTP = await db.emailOTP.findFirst({
      where: {
        email,
        type: 'VERIFICATION',
        used: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!validOTP) {
      return NextResponse.json(
        { error: 'Email adresi doğrulanmamış. Lütfen önce email adresinizi doğrulayın.' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.emailVerified) {
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
          role: 'USER', // Varsayılan rol
          emailVerified: true, // OTP doğrulaması tamamlandığı için
        },
      });


      // Default "Kişisel" etiketini oluştur
      await tx.tag.create({
        data: {
          name: "Kişisel",
          color: "#3B82F6", // Mavi renk
          userId: user.id,
        },
      });

      // Pending email assignments'ları kontrol et ve kullanıcıya aktar
      const pendingEmailAssignments = await tx.assignment.findMany({
        where: {
          email,
          userId: null, // Henüz kullanıcıya atanmamış
          status: 'PENDING'
        }
      });

      if (pendingEmailAssignments.length > 0) {
        console.log(`Found ${pendingEmailAssignments.length} pending email assignments for ${email}`);

        // Email assignments'ları yeni kullanıcıya aktar
        for (const assignment of pendingEmailAssignments) {
          try {
            await tx.assignment.update({
              where: { id: assignment.id },
              data: {
                userId: user.id,
                email: null, // Artık registered user olduğu için email'i temizle
                status: 'ACTIVE',
                acceptedAt: new Date()
              }
            });
            console.log(`Activated assignment ${assignment.id} for user ${user.id} to ${assignment.targetType}:${assignment.targetId}`);
          } catch (assignmentError) {
            console.error('Error processing email assignment during registration:', assignmentError);
            // Atama hatası ana kayıt işlemini engellememelidir
          }
        }
      }

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