import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { getUserAccessibleProjects } from "@/lib/access-control"
import { withRetry } from "@/lib/db-retry"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Yeni access control sistemi ile tüm erişilebilir projeleri getir
    const projects = await getUserAccessibleProjects(decoded.userId)

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const body = await request.json()
    const { name, emoji } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if project with same name already exists for this user
    const existingProject = await db.project.findFirst({
      where: {
        name,
        userId: decoded.userId
      }
    })

    if (existingProject) {
      return NextResponse.json({ error: "Project with this name already exists" }, { status: 409 })
    }

    const result = await db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          emoji,
          userId: decoded.userId
        },
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      })

      const defaultSection = await tx.section.create({
        data: {
          name: "Genel",
          projectId: project.id,
          order: 0
        }
      })

      // Proje oluşturma aktivitesi - transaction içinde
      try {
        await tx.projectActivity.create({
          data: {
            projectId: project.id,
            userId: decoded.userId,
            actionType: ProjectActivityTypes.PROJECT_CREATED,
            entityType: "project",
            description: `Proje oluşturuldu: "${project.name}"`
          }
        })
        console.log("Project creation activity logged successfully")
      } catch (activityError) {
        console.error("Error logging project creation activity:", activityError)
      }

      // Default section oluşturma aktivitesi - transaction içinde
      try {
        await tx.projectActivity.create({
          data: {
            projectId: project.id,
            userId: decoded.userId,
            actionType: ProjectActivityTypes.SECTION_CREATED,
            entityType: "section",
            entityId: defaultSection.id,
            entityName: defaultSection.name,
            description: `Bölüm oluşturuldu: "${defaultSection.name}"`
          }
        })
        console.log("Section creation activity logged successfully")
      } catch (activityError) {
        console.error("Error logging section creation activity:", activityError)
      }

      return project
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}