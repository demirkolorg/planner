import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      userId = decoded.userId
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const completed = searchParams.get('completed')
    const projectId = searchParams.get('projectId')

    // TaskAssignment sayısını kontrol et
    const assignmentCount = await db.taskAssignment.count({
      where: {
        assigneeId: userId
      }
    })

    // Bana atanan görevleri getir
    const tasks = await db.task.findMany({
      where: {
        assignments: {
          some: {
            assigneeId: userId
          }
        },
        ...(completed !== null && { completed: completed === 'true' }),
        ...(projectId && { projectId })
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            emoji: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            assigner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            completed: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Görevleri formatla
    const formattedTasks = tasks.map(task => ({
      ...task,
      dueDate: task.dueDate?.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }))

    return NextResponse.json({
      tasks: formattedTasks || [],
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length
    })
  } catch (error) {
    console.error('Get assigned tasks error:', error)
    return NextResponse.json(
      { 
        error: 'Atanan görevler alınırken hata oluştu',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}