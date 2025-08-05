import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // JWT token'dan user ID al
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    // Kullanıcının mevcut projelerini kontrol et
    const existingProjects = await db.project.findMany({
      where: { userId },
      select: { name: true, id: true }
    })

    const projectNames = existingProjects.map(p => p.name)
    const results = []

    // Transaction içinde varsayılan projeleri oluştur
    await db.$transaction(async (tx) => {
      // "Gelen Kutusu" projesi yoksa oluştur
      if (!projectNames.includes("Gelen Kutusu")) {
        const inboxProject = await tx.project.create({
          data: {
            name: "Gelen Kutusu",
            emoji: "📥",
            notes: "Kategorize edilmemiş görevleriniz ve yapılacaklar listeniz. Buradan diğer projelere organize edebilirsiniz.",
            userId: userId,
          },
        })

        // "Gelen Kutusu" için "Genel" bölümü oluştur
        await tx.section.create({
          data: {
            name: "Genel",
            projectId: inboxProject.id,
            order: 0,
          },
        })

        results.push("Gelen Kutusu projesi oluşturuldu")
      }

      // Varsayılan "Kişisel" etiketi yoksa oluştur
      const existingPersonalTag = await tx.tag.findFirst({
        where: {
          userId: userId,
          name: "Kişisel"
        }
      })

      if (!existingPersonalTag) {
        await tx.tag.create({
          data: {
            name: "Kişisel",
            color: "#3B82F6", // Mavi renk
            userId: userId,
          },
        })

        results.push("Kişisel etiketi oluşturuldu")
      }
    })

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Varsayılan projeler zaten mevcut"
      })
    }

    return NextResponse.json({
      success: true,
      message: "Varsayılan projeler başarıyla oluşturuldu",
      created: results
    })

  } catch (error) {
    console.error('Varsayılan proje oluşturma hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Varsayılan projeler oluşturulamadı' },
      { status: 500 }
    )
  }
}