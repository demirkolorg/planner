import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createProjectActivity, ProjectActivityTypes } from "@/lib/project-activity"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getUserProjectAccess } from "@/lib/access-control"

// Bölümü başka projeye taşı
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const { id: sectionId } = await params
    const { targetProjectId } = await request.json()

    if (!targetProjectId) {
      return NextResponse.json(
        { error: 'Target project ID is required' },
        { status: 400 }
      )
    }

    // Section'ın var olduğunu kontrol et
    const existingSection = await db.section.findUnique({
      where: { id: sectionId },
      include: {
        tasks: true,
        project: true
      }
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    // Hedef projenin var olduğunu kontrol et
    const targetProject = await db.project.findUnique({
      where: { id: targetProjectId }
    })

    if (!targetProject) {
      return NextResponse.json(
        { error: 'Target project not found' },
        { status: 404 }
      )
    }

    // Kaynak proje üzerinde access control kontrolü
    const sourceAccess = await getUserProjectAccess(decoded.userId, existingSection.project.id)
    
    if (sourceAccess.accessLevel === 'NO_ACCESS') {
      return NextResponse.json(
        { error: 'Source project not found or access denied' },
        { status: 404 }
      )
    }

    // Section taşıma izni kontrolü (sadece sahipler ve create section yetkisi olanlar)
    if (sourceAccess.accessLevel !== 'OWNER' && !sourceAccess.permissions.canCreateSection) {
      return NextResponse.json(
        { error: 'Permission denied - insufficient permissions to move sections' },
        { status: 403 }
      )
    }

    // Hedef proje üzerinde access control kontrolü
    const targetAccess = await getUserProjectAccess(decoded.userId, targetProjectId)
    
    if (targetAccess.accessLevel === 'NO_ACCESS') {
      return NextResponse.json(
        { error: 'Target project not found or access denied' },
        { status: 404 }
      )
    }

    // Hedef projede section oluşturma izni kontrolü
    if (!targetAccess.permissions.canCreateSection) {
      return NextResponse.json(
        { error: 'Permission denied - cannot create sections in target project' },
        { status: 403 }
      )
    }

    // Transaction ile section ve tüm tasks'larını taşı
    const result = await db.$transaction(async (tx) => {
      // Section'ı yeni projeye taşı
      const updatedSection = await tx.section.update({
        where: { id: sectionId },
        data: { projectId: targetProjectId },
        include: {
          project: true,
          tasks: true
        }
      })

      // Bu section'daki tüm tasks'ları da yeni projeye taşı
      if (existingSection.tasks.length > 0) {
        await tx.task.updateMany({
          where: { sectionId: sectionId },
          data: { projectId: targetProjectId }
        })
      }

      // Bölüm taşıma aktivitesi (eski projeye)
      await createProjectActivity({
        projectId: existingSection.project.id,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.SECTION_MOVED,
        entityType: "section",
        entityId: existingSection.id,
        entityName: existingSection.name,
        oldValue: existingSection.project.name,
        newValue: targetProject.name,
        description: `Bölüm taşındı: "${existingSection.name}" → ${targetProject.name}`
      })

      // Bölüm taşıma aktivitesi (yeni projeye)
      await createProjectActivity({
        projectId: targetProjectId,
        userId: decoded.userId,
        actionType: ProjectActivityTypes.SECTION_MOVED,
        entityType: "section",
        entityId: existingSection.id,
        entityName: existingSection.name,
        oldValue: existingSection.project.name,
        newValue: targetProject.name,
        description: `Bölüm alındı: "${existingSection.name}" ← ${existingSection.project.name}`
      })

      return updatedSection
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Section move error:', error)
    return NextResponse.json(
      { error: 'Failed to move section' },
      { status: 500 }
    )
  }
}