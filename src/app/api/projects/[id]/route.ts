import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { isProtectedProject, PROTECTED_PROJECT_MESSAGES } from "@/lib/project-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    const project = await db.project.findFirst({
      where: {
        id,
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

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { name, emoji, notes } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if project exists and belongs to user
    const existingProject = await db.project.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Korumalı projelerin adı ve emojisi değiştirilemez
    if (isProtectedProject(existingProject.name) && (name !== existingProject.name || emoji !== existingProject.emoji)) {
      return NextResponse.json({ 
        error: PROTECTED_PROJECT_MESSAGES.EDIT,
        allowNotesEdit: true 
      }, { status: 403 })
    }

    // Check if another project with same name exists for this user
    const duplicateProject = await db.project.findFirst({
      where: {
        name,
        userId: decoded.userId,
        id: { not: id }
      }
    })

    if (duplicateProject) {
      return NextResponse.json({ error: "Project with this name already exists" }, { status: 409 })
    }

    const updatedProject = await db.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: {
          id
        },
        data: {
          name,
          emoji,
          notes
        },
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        }
      })

      // Proje güncelleme aktivitesi (sadece isim değişmişse)
      if (existingProject.name !== name) {
        await createProjectActivity({
          projectId: id,
          userId: decoded.userId,
          actionType: ProjectActivityTypes.PROJECT_UPDATED,
          entityType: "project",
          oldValue: existingProject.name,
          newValue: name,
          description: `Proje adı güncellendi: "${existingProject.name}" → "${name}"`
        })
      }

      return updated
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error updating project:", error)
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
    
    // Check if project exists and belongs to user
    const existingProject = await db.project.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Korumalı projeler silinemez
    if (isProtectedProject(existingProject.name)) {
      return NextResponse.json({ 
        error: PROTECTED_PROJECT_MESSAGES.DELETE 
      }, { status: 403 })
    }

    await db.$transaction(async (tx) => {
      // Proje silme aktivitesi (silmeden önce ekle)
      await createProjectActivity({
        projectId: id,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.PROJECT_DELETED,
        entityType: "project",
        description: `Proje silindi: "${existingProject.name}"`
      })

      await tx.project.delete({
        where: {
          id
        }
      })
    })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}