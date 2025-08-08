import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { getUserProjectAccess } from "@/lib/access-control"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Access control kontrolü yap
    const access = await getUserProjectAccess(decoded.userId, id)
    
    if (access.accessLevel === 'NO_ACCESS') {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Sections görüntüleme izni kontrolü
    if (!access.permissions.canViewAllSections && access.visibleContent.sectionIds.length === 0) {
      return NextResponse.json([]) // Boş array döndür
    }

    // Get sections associated with this project (with access control)
    const sections = await db.section.findMany({
      where: {
        projectId: id,
        ...(access.permissions.canViewAllSections 
          ? {}
          : { id: { in: access.visibleContent.sectionIds } }
        )
      },
      orderBy: {
        order: 'asc'
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching sections for project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Access control kontrolü yap
    const access = await getUserProjectAccess(decoded.userId, id)
    
    if (access.accessLevel === 'NO_ACCESS') {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Section oluşturma izni kontrolü
    if (!access.permissions.canCreateSection) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Get the highest order number for sections in this project
    const lastSection = await db.section.findFirst({
      where: {
        projectId: id
      },
      orderBy: {
        order: 'desc'
      }
    })

    const order = lastSection ? lastSection.order + 1 : 0

    // Create the section
    const section = await db.$transaction(async (tx) => {
      const newSection = await tx.section.create({
        data: {
          name,
          projectId: id,
          order
        },
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      })

      // Bölüm oluşturma aktivitesi
      await createProjectActivity({
        projectId: id,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.SECTION_CREATED,
        entityType: "section",
        entityId: newSection.id,
        entityName: newSection.name,
        description: `Bölüm oluşturuldu: "${newSection.name}"`
      })

      return newSection
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error("Error creating section:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}