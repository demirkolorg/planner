import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Önce section'ın var olduğunu ve kullanıcının erişim hakkı olduğunu kontrol et
    const section = await db.section.findFirst({
      where: {
        id
      },
      include: {
        project: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    if (section.project.userId !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Section'ı güncelle
    const updatedSection = await db.section.update({
      where: {
        id
      },
      data: {
        name
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error("Error updating section:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params

    // Önce section'ın var olduğunu ve kullanıcının erişim hakkı olduğunu kontrol et
    const section = await db.section.findFirst({
      where: {
        id
      },
      include: {
        project: {
          select: {
            userId: true,
            id: true
          }
        },
        tasks: {
          select: {
            id: true
          }
        }
      }
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    if (section.project.userId !== decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Transaction kullanarak önce tüm görevleri sil, sonra section'ı sil
    await db.$transaction(async (tx) => {
      // Bölüm silme aktivitesi (silmeden önce ekle)
      await createProjectActivity({
        projectId: section.project.id,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.SECTION_DELETED,
        entityType: "section",
        entityId: section.id,
        entityName: section.name,
        description: `Bölüm silindi: "${section.name}"`
      })

      // Önce section'daki tüm task'ları sil
      await tx.task.deleteMany({
        where: {
          sectionId: id
        }
      })

      // Sonra section'ı sil
      await tx.section.delete({
        where: {
          id
        }
      })
    })

    return NextResponse.json({ message: "Section deleted successfully" })
  } catch (error) {
    console.error("Error deleting section:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}