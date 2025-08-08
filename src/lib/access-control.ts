import { db } from "@/lib/db"

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
 * Kullanıcının bir projedeki erişim seviyesini hesaplar
 */
export async function getUserProjectAccess(
  userId: string, 
  projectId: string
): Promise<UserProjectAccess> {
  // Proje ve ilgili tüm verileri getir
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      // Proje üyelikleri
      members: {
        where: { userId },
        select: { role: true }
      },
      // Proje atamaları (yeni)
      assignments: {
        where: { assigneeId: userId },
        select: { role: true }
      },
      // Bölüm atamaları - tüm atamaları getir, sonra filtreleyeceğiz
      sections: {
        include: {
          assignments: {
            select: { assigneeId: true, role: true }
          }
        }
      },
      // Görev atamaları - tüm atamaları getir, sonra filtreleyeceğiz
      tasks: {
        include: {
          assignments: {
            select: { assigneeId: true }
          }
        }
      }
    }
  })

  if (!project) {
    return createNoAccessResult()
  }

  // Proje sahibi kontrolü
  const isProjectOwner = project.userId === userId

  // Proje üyesi kontrolü (mevcut sistem)
  const projectMember = project.members[0]

  // Proje ataması kontrolü (yeni sistem)
  const projectAssignment = project.assignments[0]

  // Bölüm atamalarını topla - sadece bu kullanıcının atandığı bölümler
  const sectionAssignments = project.sections
    .filter(section => section.assignments.some((assignment: any) => assignment.assigneeId === userId))
    .map(section => section.id)

  // Görev atamalarını topla - sadece bu kullanıcının atandığı görevler
  const taskAssignments = project.tasks
    .filter(task => task.assignments.some((assignment: any) => assignment.assigneeId === userId))
    .map(task => task.id)


  // Access Level hesapla - En spesifik erişimden genel erişime doğru
  let accessLevel: AccessLevel
  if (isProjectOwner) {
    accessLevel = 'OWNER'
  } else if (taskAssignments.length > 0) {
    accessLevel = 'TASK_ASSIGNED'
  } else if (sectionAssignments.length > 0) {
    accessLevel = 'SECTION_ASSIGNED'
  } else if (projectAssignment) {
    accessLevel = 'PROJECT_ASSIGNED'
  } else if (projectMember) {
    accessLevel = 'PROJECT_MEMBER'
  } else {
    return createNoAccessResult()
  }

  // Permissions hesapla
  const permissions = calculatePermissions(accessLevel, projectMember?.role, projectAssignment?.role)

  // Görülebilir içeriği hesapla
  const visibleContent = await calculateVisibleContent(
    project,
    accessLevel,
    sectionAssignments,
    taskAssignments
  )

  return {
    accessLevel,
    isProjectOwner,
    projectAssignment: projectAssignment || null,
    sectionAssignments,
    taskAssignments,
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
      const taskSectionIds = project.tasks
        .filter((task: any) => taskAssignments.includes(task.id))
        .map((task: any) => task.sectionId)
        .filter(Boolean)
      visibleSectionIds = [...new Set(taskSectionIds)]
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
  const projects = await db.project.findMany({
    where: {
      OR: [
        { userId },                    // Sahip olduğu projeler
        { 
          members: {
            some: { userId }
          }
        },                            // Üye olduğu projeler
        {
          assignments: {
            some: { assigneeId: userId }
          }
        },                            // Proje ataması olan projeler
        {
          sections: {
            some: {
              assignments: {
                some: { assigneeId: userId }
              }
            }
          }
        },                            // Bölüm ataması olan projeler
        {
          tasks: {
            some: {
              assignments: {
                some: { assigneeId: userId }
              }
            }
          }
        }                             // Görev ataması olan projeler
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
      assignments: {
        where: { assigneeId: userId },
        select: { role: true }
      },
      _count: {
        select: {
          tasks: true,
          sections: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

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