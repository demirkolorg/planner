import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Bölümü başka projeye taşı
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sectionId = params.id
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