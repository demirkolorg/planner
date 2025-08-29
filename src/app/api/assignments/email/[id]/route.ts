import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { withReadRetry } from "@/lib/db-retry"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    // Email assignment'ını getir (retry ile)
    const assignment = await withReadRetry(async () =>
      db.assignment.findUnique({
        where: { 
          id: id,
          status: 'PENDING', // Sadece pending email assignment'ları
          email: { not: null } // Email field'ı dolu olanlar
        },
        include: {
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    )

    if (!assignment) {
      return NextResponse.json(
        { error: "Bu atama bulunamadı veya süresi dolmuş olabilir." },
        { status: 404 }
      )
    }

    // Expiry check
    if (assignment.expiresAt && assignment.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Bu atamanın süresi dolmuş." },
        { status: 410 } // Gone
      )
    }

    // Target name'i resolve et
    let targetName = 'Unknown'
    let targetDetails = null

    try {
      switch (assignment.targetType) {
        case 'PROJECT':
          const project = await db.project.findUnique({
            where: { id: assignment.targetId },
            select: { name: true, emoji: true }
          })
          targetName = project ? `${project.emoji || '📁'} ${project.name}` : 'Unknown Project'
          targetDetails = project
          break

        case 'SECTION':
          const section = await db.section.findUnique({
            where: { id: assignment.targetId },
            select: { 
              name: true,
              project: {
                select: { name: true, emoji: true }
              }
            }
          })
          if (section) {
            const projectEmoji = section.project?.emoji || '📁'
            const projectName = section.project?.name || 'Unknown Project'
            targetName = `${projectEmoji} ${projectName} / ${section.name}`
            targetDetails = section
          }
          break

        case 'TASK':
          const task = await db.task.findUnique({
            where: { id: assignment.targetId },
            select: { 
              title: true,
              project: {
                select: { name: true, emoji: true }
              }
            }
          })
          if (task) {
            const projectEmoji = task.project?.emoji || '📁'
            const projectName = task.project?.name || 'Unknown Project'
            targetName = `${projectEmoji} ${projectName} / ${task.title}`
            targetDetails = task
          }
          break
      }
    } catch (error) {
      console.error('Error resolving target name:', error)
      // targetName zaten 'Unknown' olarak set edildi
    }

    return NextResponse.json({
      id: assignment.id,
      targetType: assignment.targetType,
      targetId: assignment.targetId,
      targetName,
      targetDetails,
      email: assignment.email,
      assignedBy: assignment.assignedBy,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      expiresAt: assignment.expiresAt,
      message: assignment.message,
      assigner: assignment.assigner
    })

  } catch (error) {
    console.error('Error fetching email assignment:', error)
    return NextResponse.json(
      { error: "Sunucu hatası oluştu" },
      { status: 500 }
    )
  }
}