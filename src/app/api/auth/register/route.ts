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

      // Email assignment'larını kontrol et ve inherit et
      const pendingEmailAssignments = await tx.emailAssignment.findMany({
        where: {
          email,
          status: 'PENDING'
        }
      });

      if (pendingEmailAssignments.length > 0) {
        console.log(`Found ${pendingEmailAssignments.length} pending email assignments for ${email}`);

        for (const emailAssignment of pendingEmailAssignments) {
          try {
            // Email assignment'ı ACTIVE duruma güncelle
            await tx.emailAssignment.update({
              where: { id: emailAssignment.id },
              data: {
                status: 'ACTIVE',
                acceptedAt: new Date()
              }
            });

            // Target tipine göre gerçek assignment oluştur
            if (emailAssignment.targetType === 'PROJECT') {
              // Zaten var olan assignment kontrol et
              const existing = await tx.projectAssignment.findFirst({
                where: {
                  projectId: emailAssignment.targetId,
                  assigneeId: user.id
                }
              });

              if (!existing) {
                await tx.projectAssignment.create({
                  data: {
                    projectId: emailAssignment.targetId,
                    assigneeId: user.id,
                    assignedBy: emailAssignment.assignedBy,
                    role: emailAssignment.role
                  }
                });
                console.log(`Created project assignment for user ${user.id} to project ${emailAssignment.targetId}`);
              }

            } else if (emailAssignment.targetType === 'SECTION') {
              // Zaten var olan assignment kontrol et
              const existing = await tx.sectionAssignment.findFirst({
                where: {
                  sectionId: emailAssignment.targetId,
                  assigneeId: user.id
                }
              });

              if (!existing) {
                await tx.sectionAssignment.create({
                  data: {
                    sectionId: emailAssignment.targetId,
                    assigneeId: user.id,
                    assignedBy: emailAssignment.assignedBy,
                    role: emailAssignment.role
                  }
                });
                console.log(`Created section assignment for user ${user.id} to section ${emailAssignment.targetId}`);
              }

            } else if (emailAssignment.targetType === 'TASK') {
              // Task assignment için önce mevcut atamaları temizle (tek kişilik sistem)
              await tx.taskAssignment.deleteMany({
                where: {
                  taskId: emailAssignment.targetId
                }
              });

              await tx.taskAssignment.create({
                data: {
                  taskId: emailAssignment.targetId,
                  assigneeId: user.id,
                  assignedBy: emailAssignment.assignedBy
                }
              });
              console.log(`Created task assignment for user ${user.id} to task ${emailAssignment.targetId}`);
            }

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