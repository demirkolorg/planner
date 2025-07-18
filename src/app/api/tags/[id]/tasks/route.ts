import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Check if tag exists
    const tag = await db.tag.findUnique({
      where: {
        id
      }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Get tasks associated with this tag
    const tasks = await db.task.findMany({
      where: {
        tagId: id
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