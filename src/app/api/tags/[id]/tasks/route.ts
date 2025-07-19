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
    
    // Check if tag exists and belongs to user
    const tag = await db.tag.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Get tasks associated with this tag through TaskTag junction table
    const tasks = await db.task.findMany({
      where: {
        tags: {
          some: {
            tagId: id
          }
        },
        userId: decoded.userId
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        project: true,
        section: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks for tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}