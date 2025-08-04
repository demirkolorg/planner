import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id, fieldId } = await params
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

    // Özel alanın varlığını kontrol et
    const existingField = await db.projectCustomField.findFirst({
      where: {
        id: fieldId,
        projectId: id
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 })
    }

    // Aynı key'e sahip başka alan var mı kontrol et (mevcut alan hariç)
    const duplicateField = await db.projectCustomField.findFirst({
      where: {
        projectId: id,
        key: key.trim(),
        id: { not: fieldId }
      }
    })

    if (duplicateField) {
      return NextResponse.json({ error: "A field with this name already exists" }, { status: 409 })
    }

    // Özel alanı güncelle
    const updatedField = await db.projectCustomField.update({
      where: {
        id: fieldId
      },
      data: {
        key: key.trim(),
        value: value.trim()
      }
    })

    return NextResponse.json(updatedField)
  } catch (error) {
    console.error("Error updating custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id, fieldId } = await params

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

    // Özel alanın varlığını kontrol et
    const existingField = await db.projectCustomField.findFirst({
      where: {
        id: fieldId,
        projectId: id
      }
    })

    if (!existingField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 })
    }

    // Özel alanı sil
    await db.projectCustomField.delete({
      where: {
        id: fieldId
      }
    })

    return NextResponse.json({ message: "Custom field deleted successfully" })
  } catch (error) {
    console.error("Error deleting custom field:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}