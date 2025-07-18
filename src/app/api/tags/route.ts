import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // For now, we'll get all tags without user filtering
    // In production, you'd want to implement proper auth middleware
    const tags = await db.tag.findMany({
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

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Check if tag with same name already exists
    const existingTag = await db.tag.findFirst({
      where: {
        name
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 })
    }

    const tag = await db.tag.create({
      data: {
        name,
        color
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}