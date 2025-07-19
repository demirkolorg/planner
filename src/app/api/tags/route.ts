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
    
    const tags = await db.tag.findMany({
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

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
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
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    // Check if tag with same name already exists for this user
    const existingTag = await db.tag.findFirst({
      where: {
        name,
        userId: decoded.userId
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 })
    }

    const tag = await db.tag.create({
      data: {
        name,
        color,
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

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}