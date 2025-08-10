import { db } from "@/lib/db"
import { withReadRetry } from "@/lib/db-retry"

// Access Level Types
export type AccessLevel = 
  | 'OWNER'             // Tüm yetkiler
  | 'PROJECT_MEMBER'    // Proje üyesi (mevcut sistem)
  | 'PROJECT_ASSIGNED'  // Tüm projeye atanmış
  | 'SECTION_ASSIGNED'  // Belirli bölüm(ler)e atanmış  
  | 'TASK_ASSIGNED'     // Belirli görev(ler)e atanmış
  | 'NO_ACCESS'         // Erişim yok

// User Project Access Information
export interface UserProjectAccess {
  accessLevel: AccessLevel
  isProjectOwner: boolean
  projectAssignment: any | null
  sectionAssignments: string[]  // Section IDs
  taskAssignments: string[]     // Task IDs
  permissions: {
    canViewProject: boolean
    canEditProject: boolean
    canViewAllSections: boolean
    canViewAllTasks: boolean
    canCreateTask: boolean
    canCreateSection: boolean
    canAssignTasks: boolean
    canManageMembers: boolean
    canViewSettings: boolean
    canEditSettings: boolean
    canDeleteProject: boolean
  }
  visibleContent: {
    sectionIds: string[]
    taskIds: string[]
  }
}

/**
 * Kullanıcının bir projedeki erişim seviyesini hesaplar (Optimized)
 */
export async function getUserProjectAccess(
  userId: string, 
  projectId: string
): Promise<UserProjectAccess> {
  // Optimize edilmiş query - sadece gerekli verileri getir
  const [
    project, 
    projectMember, 
    projectAssignments,
    sectionAssignments,
    taskAssignments
  ] = await Promise.all([
    // Basic project info
    withReadRetry(async () => 
      db.project.findUnique({
        where: { id: projectId },
        select: { 
          id: true, 
          userId: true, 
          name: true 
        }
      })
    ),
    // User's project membership
    withReadRetry(async () =>
      db.projectMember.findFirst({
        where: { projectId, userId },
        select: { role: true }
      })
    ),
    // User's assignments (all types)
    withReadRetry(async () =>
      db.assignment.findMany({
        where: { 
          targetId: projectId,
          targetType: 'PROJECT',
          OR: [
            { userId: userId, status: 'ACTIVE' },
            { email: null } // Only user assignments, not email
          ]
        }
      })
    ),
    // User's section assignments in this project
    withReadRetry(async () =>
      db.assignment.findMany({
        where: { 
          targetType: 'SECTION',
          userId: userId,
          status: 'ACTIVE'
        },
        select: { targetId: true }
      })
    ),
    // User's task assignments in this project
    withReadRetry(async () =>
      db.assignment.findMany({
        where: { 
          targetType: 'TASK',
          userId: userId,
          status: 'ACTIVE'
        },
        select: { targetId: true }
      })
    )
  ])

  if (!project) {
    return createNoAccessResult()
  }

  // Proje sahibi kontrolü
  const isProjectOwner = project.userId === userId

  // Assignment listelerini hazırla
  const sectionAssignmentIds = sectionAssignments.map(sa => sa.targetId)
  const taskAssignmentIds = taskAssignments.map(ta => ta.targetId)
  const projectAssignment = projectAssignments.length > 0 ? projectAssignments[0] : null


  // Access Level hesapla - En spesifik erişimden genel erişime doğru
  let accessLevel: AccessLevel
  if (isProjectOwner) {
    accessLevel = 'OWNER'
  } else if (taskAssignmentIds.length > 0) {
    accessLevel = 'TASK_ASSIGNED'
  } else if (sectionAssignmentIds.length > 0) {
    accessLevel = 'SECTION_ASSIGNED'
  } else if (projectAssignment) {
    accessLevel = 'PROJECT_ASSIGNED'
  } else if (projectMember) {
    accessLevel = 'PROJECT_MEMBER'
  } else {
    return createNoAccessResult()
  }

  // Permissions hesapla
  const permissions = calculatePermissions(accessLevel, projectMember?.role, 'COLLABORATOR')

  // Görülebilir içeriği hesapla (simplified)
  const visibleContent = {
    sectionIds: sectionAssignmentIds,
    taskIds: taskAssignmentIds
  }

  return {
    accessLevel,
    isProjectOwner,
    projectAssignment: projectAssignment || null,
    sectionAssignments: sectionAssignmentIds,
    taskAssignments: taskAssignmentIds,
    permissions,
    visibleContent
  }
}

/**
 * Access level'a göre izinleri hesaplar
 */
function calculatePermissions(
  accessLevel: AccessLevel,
  memberRole?: any,
  assignmentRole?: any
) {
  const basePermissions = {
    canViewProject: false,
    canEditProject: false,
    canViewAllSections: false,
    canViewAllTasks: false,
    canCreateTask: false,
    canCreateSection: false,
    canAssignTasks: false,
    canManageMembers: false,
    canViewSettings: false,
    canEditSettings: false,
    canDeleteProject: false
  }

  switch (accessLevel) {
    case 'OWNER':
      return {
        canViewProject: true,
        canEditProject: true,
        canViewAllSections: true,
        canViewAllTasks: true,
        canCreateTask: true,
        canCreateSection: true,
        canAssignTasks: true,
        canManageMembers: true,
        canViewSettings: true,
        canEditSettings: true,
        canDeleteProject: true
      }

    case 'PROJECT_MEMBER':
      return {
        ...basePermissions,
        canViewProject: true,
        canEditProject: memberRole !== 'VIEWER',
        canViewAllSections: true,
        canViewAllTasks: true,
        canCreateTask: memberRole !== 'VIEWER',
        canCreateSection: memberRole !== 'VIEWER',
        canAssignTasks: memberRole === 'OWNER',
        canViewSettings: true
      }

    case 'PROJECT_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,
        canEditProject: assignmentRole === 'COLLABORATOR',
        canViewAllSections: true,
        canViewAllTasks: true,
        canCreateTask: assignmentRole === 'COLLABORATOR',
        canCreateSection: assignmentRole === 'COLLABORATOR',
        canAssignTasks: false
      }

    case 'SECTION_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,
        canEditProject: false,
        canViewAllSections: false,
        canViewAllTasks: false,
        canCreateTask: false,
        canCreateSection: false,
        canAssignTasks: false
      }

    case 'TASK_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,
        canEditProject: false,
        canViewAllSections: false,
        canViewAllTasks: false,
        canCreateTask: false,
        canCreateSection: false,
        canAssignTasks: false
      }

    default:
      return basePermissions
  }
}

/**
 * Görülebilir içeriği hesaplar
 */
async function calculateVisibleContent(
  project: any,
  accessLevel: AccessLevel,
  sectionAssignments: string[],
  taskAssignments: string[]
) {
  let visibleSectionIds: string[] = []
  let visibleTaskIds: string[] = []


  switch (accessLevel) {
    case 'OWNER':
    case 'PROJECT_MEMBER':
    case 'PROJECT_ASSIGNED':
      // Tüm bölümler ve görevler görülebilir
      visibleSectionIds = project.sections.map((s: any) => s.id)
      visibleTaskIds = project.tasks.map((t: any) => t.id)
      break

    case 'SECTION_ASSIGNED':
      // Sadece atanmış bölümler ve o bölümlerdeki görevler
      visibleSectionIds = sectionAssignments
      visibleTaskIds = project.tasks
        .filter((task: any) => sectionAssignments.includes(task.sectionId))
        .map((task: any) => task.id)
      break

    case 'TASK_ASSIGNED':
      // Sadece atanmış görevler ve onların bulunduğu bölümler
      visibleTaskIds = taskAssignments
      // Simplified - section bilgisini şimdilik atla 
      visibleSectionIds = []
      break

    default:
      break
  }


  return {
    sectionIds: visibleSectionIds,
    taskIds: visibleTaskIds
  }
}

/**
 * Erişim yok durumu için sonuç oluştur
 */
function createNoAccessResult(): UserProjectAccess {
  return {
    accessLevel: 'NO_ACCESS',
    isProjectOwner: false,
    projectAssignment: null,
    sectionAssignments: [],
    taskAssignments: [],
    permissions: {
      canViewProject: false,
      canEditProject: false,
      canViewAllSections: false,
      canViewAllTasks: false,
      canCreateTask: false,
      canCreateSection: false,
      canAssignTasks: false,
      canManageMembers: false,
      canViewSettings: false,
      canEditSettings: false,
      canDeleteProject: false
    },
    visibleContent: {
      sectionIds: [],
      taskIds: []
    }
  }
}

/**
 * Kullanıcının erişebileceği projeleri getirir
 */
export async function getUserAccessibleProjects(userId: string) {
  // Step 1: Kullanıcının sahip olduğu ve üye olduğu projeler
  const ownedAndMemberProjects = await withReadRetry(async () => {
    return await db.project.findMany({
      where: {
        OR: [
          { userId },                    // Sahip olduğu projeler
          { 
            members: {
              some: { userId }
            }
          }                             // Üye olduğu projeler
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        members: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            tasks: true,
            sections: true
          }
        }
      }
    })
  })
  
  // Step 2: Kullanıcının assignment'ları olan projeleri bul
  const userAssignments = await withReadRetry(async () => {
    return await db.assignment.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
        targetType: { in: ['PROJECT', 'SECTION', 'TASK'] }
      },
      include: {
        // İlgili target entityleri include etmeyeceğiz, sadece ID'leri alacağız
      }
    })
  })

  // Project ID'leri topla (direkt PROJECT assignments)
  const assignedProjectIds = new Set(
    userAssignments
      .filter(a => a.targetType === 'PROJECT')
      .map(a => a.targetId)
  )

  // Section ve Task assignment'larından da proje ID'lerini bul
  if (userAssignments.some(a => a.targetType === 'SECTION')) {
    const sectionIds = userAssignments
      .filter(a => a.targetType === 'SECTION')
      .map(a => a.targetId)
    
    if (sectionIds.length > 0) {
      const sections = await withReadRetry(async () => {
        return await db.section.findMany({
          where: { id: { in: sectionIds } },
          select: { projectId: true }
        })
      })
      sections.forEach(s => assignedProjectIds.add(s.projectId))
    }
  }

  if (userAssignments.some(a => a.targetType === 'TASK')) {
    const taskIds = userAssignments
      .filter(a => a.targetType === 'TASK')
      .map(a => a.targetId)
    
    if (taskIds.length > 0) {
      const tasks = await withReadRetry(async () => {
        return await db.task.findMany({
          where: { id: { in: taskIds } },
          select: { projectId: true }
        })
      })
      tasks.forEach(t => t.projectId && assignedProjectIds.add(t.projectId))
    }
  }

  // Atanmış olduğu ama member olmadığı projeleri getir
  const assignedOnlyProjectIds = Array.from(assignedProjectIds).filter(
    projectId => !ownedAndMemberProjects.some(p => p.id === projectId)
  )

  let assignedOnlyProjects: any[] = []
  if (assignedOnlyProjectIds.length > 0) {
    assignedOnlyProjects = await withReadRetry(async () => {
      return await db.project.findMany({
        where: {
          id: { in: assignedOnlyProjectIds }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          members: {
            where: { userId },
            select: { role: true }
          },
          _count: {
            select: {
              tasks: true,
              sections: true
            }
          }
        }
      })
    })
  }

  // Tüm projeleri birleştir
  const allProjects = [...ownedAndMemberProjects, ...assignedOnlyProjects]
  
  // Tarihe göre sırala
  const projects = allProjects.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  // Her proje için access level hesapla
  const projectsWithAccess = await Promise.all(
    projects.map(async (project) => {
      const access = await getUserProjectAccess(userId, project.id)
      return {
        ...project,
        userAccess: access
      }
    })
  )

  return projectsWithAccess
}

/**
 * Middleware için hızlı erişim kontrolü
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const access = await getUserProjectAccess(userId, projectId)
  return access.accessLevel !== 'NO_ACCESS'
}