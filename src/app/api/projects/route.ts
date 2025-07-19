import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    const projects = await db.project.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

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

      await tx.section.create({
        data: {
          name: "Genel",
          projectId: project.id,
          order: 0
        }
      })

      return project
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}