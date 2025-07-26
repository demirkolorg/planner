import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    
    // Check if project exists and belongs to user
    const project = await db.project.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all tasks associated with this project (both parent and sub-tasks)
    const tasks = await db.task.findMany({
      where: {
        projectId: id
      },
      include: {
        tags: {
          select: {
            id: true,
            tag: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        reminders: {
          select: {
            id: true,
            datetime: true,
            message: true,
            isActive: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true,
            subTasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("❌ Error fetching tasks for project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}