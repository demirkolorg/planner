import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { authenticateUser } from "@/lib/auth"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { getUserAccessibleProjects } from "@/lib/access-control"
import { withRetry, withTransactionRetry } from "@/lib/db-retry"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await authenticateUser(token)
    
    // Yeni access control sistemi ile tüm erişilebilir projeleri getir
    const projects = await getUserAccessibleProjects(userId)

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error("Error fetching projects:", error)
    if (error.message === 'Authentication failed') {
      return NextResponse.json({ error: "Please login again" }, { status: 401 })
    }
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

    const { userId } = await authenticateUser(token)
    
    const body = await request.json()
    const { name, emoji } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if project with same name already exists for this user (retry ile)
    const existingProject = await withRetry(async () =>
      db.project.findFirst({
        where: {
          name,
          userId: userId
        }
      })
    )

    if (existingProject) {
      return NextResponse.json({ error: "Project with this name already exists" }, { status: 409 })
    }

    const result = await withTransactionRetry(async () =>
      db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          emoji,
          userId: userId
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
            userId: userId,
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
            userId: userId,
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
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error creating project:", error)
    if (error.message === 'Authentication failed') {
      return NextResponse.json({ error: "Please login again" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}