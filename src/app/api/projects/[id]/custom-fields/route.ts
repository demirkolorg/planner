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

    // Projenin kullanıcıya ait olduğunu kontrol et
    const project = await db.project.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Projeye ait özel alanları getir
    const customFields = await db.projectCustomField.findMany({
      where: {
        projectId: id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(customFields)
  } catch (error) {
    console.error("Error fetching custom fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id } = await params
    const body = await request.json()
    const { key, value } = body

    if (!key || !value) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    // Projenin kullanıcıya ait olduğunu kontrol et
    const project = await db.project.findFirst({
      where: {
        id,
        userId: decoded.userId
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Aynı key'e sahip başka alan var mı kontrol et
    const existingField = await db.projectCustomField.findFirst({
      where: {
        projectId: id,
        key: key.trim()
      }
    })

    if (existingField) {
      return NextResponse.json({ error: "A field with this name already exists" }, { status: 409 })
    }

    // Yeni özel alan oluştur
    const customField = await db.projectCustomField.create({
      data: {
        projectId: id,
        key: key.trim(),
        value: value.trim()
      }
    })

    return NextResponse.json(customField, { status: 201 })
  } catch (error) {
    console.error("Error creating custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}