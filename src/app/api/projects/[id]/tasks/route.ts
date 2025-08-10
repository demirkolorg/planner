import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
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
    
    // Access control kontrolü
    const access = await getUserProjectAccess(decoded.userId, id)
    
    if (access.accessLevel === 'NO_ACCESS') {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 })
    }

    // Görülebilir görevleri getir
    const whereClause: any = { projectId: id }
    
    if (!access.permissions.canViewAllTasks) {
      whereClause.id = { in: access.visibleContent.taskIds }
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true
              }
            }
          }
        },
        subTasks: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Assignment bilgilerini ayrı olarak ekle
    const tasksWithAssignments = await Promise.all(
      tasks.map(async (task) => {
        const assignments = await db.assignment.findMany({
          where: {
            targetType: 'TASK',
            targetId: task.id,
            status: 'ACTIVE'
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assigner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        })

        return {
          ...task,
          assignments
        }
      })
    )

    return NextResponse.json(tasksWithAssignments)
  } catch (error) {
    console.error("❌ Error fetching tasks for project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}