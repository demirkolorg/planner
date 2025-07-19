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
    
    const tag = await db.tag.findFirst({
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

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error fetching tag:", error)
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
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Check if tag exists and belongs to user
    const existingTag = await db.tag.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Check if another tag with same name exists for this user
    const duplicateTag = await db.tag.findFirst({
      where: {
        name,
        userId: decoded.userId,
        id: { not: id }
      }
    })

    if (duplicateTag) {
      return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 })
    }

    const updatedTag = await db.tag.update({
      where: {
        id
      },
      data: {
        name,
        color
      },
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error("Error updating tag:", error)
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
    
    // Check if tag exists and belongs to user
    const existingTag = await db.tag.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    await db.tag.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ message: "Tag deleted successfully" })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}