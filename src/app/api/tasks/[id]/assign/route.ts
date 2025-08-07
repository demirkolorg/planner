import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { createTaskActivity, TaskActivityTypes, getActivityDescription } from '@/lib/task-activity'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    const taskId = params.id
    const { assigneeId } = await request.json()

    if (!assigneeId) {
      return NextResponse.json({ error: 'AssigneeId is required' }, { status: 400 })
    }

    // Görevin var olup olmadığını ve yetkisini kontrol et
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId: userId }, // Görev sahibi
          {
            project: {
              OR: [
                { userId: userId }, // Proje sahibi
                {
                  members: {
                    some: {
                      userId: userId,
                      role: { in: ['OWNER', 'MEMBER'] } // Proje üyesi (VIEWER hariç)
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Görev bulunamadı veya yetkiniz yok' },
        { status: 404 }
      )
    }

    // Atanacak kullanıcının var olup olmadığını kontrol et
    const assignee = await db.user.findUnique({
      where: { id: assigneeId }
    })

    if (!assignee) {
      return NextResponse.json({ error: 'Atanacak kullanıcı bulunamadı' }, { status: 404 })
    }

    // Eğer görev bir projeye bağlıysa, atanacak kişinin proje üyesi olup olmadığını kontrol et
    if (task.projectId) {
      const isProjectMember = await db.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: assigneeId
        }
      })

      // Proje sahibi veya üyesi değilse, otomatik olarak MEMBER rolü ile ekle
      if (!isProjectMember && task.project?.userId !== assigneeId) {
        await db.projectMember.create({
          data: {
            projectId: task.projectId,
            userId: assigneeId,
            role: 'MEMBER',
            addedBy: userId
          }
        })
      }
    }

    // Mevcut atamayı kontrol et (aktivite için)
    const existingAssignments = await db.taskAssignment.findMany({
      where: { taskId: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Tek kişiye atama sistemi - önce mevcut tüm atamaları temizle
    await db.taskAssignment.deleteMany({
      where: {
        taskId: taskId
      }
    })

    // Yeni atamayı oluştur
    const assignment = await db.taskAssignment.create({
      data: {
        taskId,
        assigneeId,
        assignedBy: userId
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Activity oluştur
    const newUserName = `${assignment.assignee.firstName} ${assignment.assignee.lastName}`
    let activityType: string
    let description: string
    let oldValue: string | null = null

    if (existingAssignments.length > 0) {
      // Reassignment
      const oldUser = existingAssignments[0]
      const oldUserName = `${oldUser.assignee.firstName} ${oldUser.assignee.lastName}`
      activityType = TaskActivityTypes.USER_REASSIGNED
      description = getActivityDescription(TaskActivityTypes.USER_REASSIGNED, oldUserName, newUserName)
      oldValue = oldUserName
    } else {
      // New assignment
      activityType = TaskActivityTypes.USER_ASSIGNED
      description = getActivityDescription(TaskActivityTypes.USER_ASSIGNED, null, newUserName)
    }

    await createTaskActivity({
      taskId: taskId,
      userId: userId,
      actionType: activityType,
      oldValue: oldValue,
      newValue: newUserName,
      description: description
    })

    return NextResponse.json({
      message: 'Görev başarıyla atandı',
      assignment
    })
  } catch (error) {
    console.error('Task assignment error:', error)
    return NextResponse.json(
      { error: 'Görev atama sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const userId = decoded.userId

    const taskId = params.id

    // Görevin var olup olmadığını ve yetkisini kontrol et
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { userId: userId }, // Görev sahibi
          {
            project: {
              OR: [
                { userId: userId }, // Proje sahibi
                {
                  members: {
                    some: {
                      userId: userId,
                      role: { in: ['OWNER', 'MEMBER'] }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Görev bulunamadı veya yetkiniz yok' },
        { status: 404 }
      )
    }

    // Mevcut atamaları kontrol et (aktivite için)
    const existingAssignments = await db.taskAssignment.findMany({
      where: { taskId: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Tüm atamaları kaldır (tek atama sisteminde)
    await db.taskAssignment.deleteMany({
      where: {
        taskId: taskId
      }
    })

    // Activity oluştur (eğer assignment varsa)
    if (existingAssignments.length > 0) {
      const removedUser = existingAssignments[0]
      const removedUserName = `${removedUser.assignee.firstName} ${removedUser.assignee.lastName}`
      
      await createTaskActivity({
        taskId: taskId,
        userId: userId,
        actionType: TaskActivityTypes.USER_UNASSIGNED,
        oldValue: removedUserName,
        newValue: null,
        description: getActivityDescription(TaskActivityTypes.USER_UNASSIGNED, removedUserName, null)
      })
    }

    return NextResponse.json({
      message: 'Görev ataması başarıyla kaldırıldı'
    })
  } catch (error) {
    console.error('Task unassignment error:', error)
    return NextResponse.json(
      { error: 'Atama kaldırma sırasında hata oluştu' },
      { status: 500 }
    )
  }
}