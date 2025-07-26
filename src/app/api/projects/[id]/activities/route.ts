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
    const { id: projectId } = await params
    
    // Projenin kullanıcıya ait olduğunu kontrol et
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        userId: decoded.userId
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Proje aktivitelerini getir
    const activities = await db.projectActivity.findMany({
      where: {
        projectId: projectId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // En yeni aktiviteler önce
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Error fetching project activities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}