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
    canCompleteTask: boolean
    canSubmitForApproval: boolean
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

  // Görülebilir içeriği hesapla 
  const visibleContent = await calculateVisibleContent(
    accessLevel,
    sectionAssignmentIds, 
    taskAssignmentIds,
    project.id
  )

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
    canDeleteProject: false,
    canCompleteTask: false,
    canSubmitForApproval: false
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
        canDeleteProject: true,
        canCompleteTask: true,              // ✅ Görevleri tamamlayabilir
        canSubmitForApproval: false         // ❌ Owner kendi görevini onaya gönderemez
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
        canViewSettings: true,
        canCompleteTask: memberRole !== 'VIEWER',  // ✅ Viewer hariç tamamlayabilir
        canSubmitForApproval: true                 // ✅ Onaya gönderebilir
      }

    case 'PROJECT_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,
        canEditProject: false,              // ❌ Proje düzenleyemez
        canViewAllSections: true,           // ✅ Tüm bölümleri görebilir
        canViewAllTasks: true,              // ✅ Tüm görevleri görebilir
        canCreateTask: false,               // ❌ Görev oluşturamaz
        canCreateSection: false,            // ❌ Bölüm oluşturamaz
        canAssignTasks: false,              // ❌ Atama yapamaz
        canCompleteTask: false,             // ❌ Direkt tamamlayamaz
        canSubmitForApproval: true          // ✅ Onaya gönderebilir
      }

    case 'SECTION_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,               // ✅ Projeyi görebilir
        canEditProject: false,              // ❌ Proje düzenleyemez
        canViewAllSections: false,          // ❌ Sadece atandığı bölümleri görebilir
        canViewAllTasks: false,             // ❌ Sadece bölümündeki görevleri görebilir
        canCreateTask: false,               // ❌ Görev oluşturamaz
        canCreateSection: false,            // ❌ Bölüm oluşturamaz
        canAssignTasks: false,              // ❌ Atama yapamaz
        canCompleteTask: false,             // ❌ Direkt tamamlayamaz
        canSubmitForApproval: true          // ✅ Onaya gönderebilir
      }

    case 'TASK_ASSIGNED':
      return {
        ...basePermissions,
        canViewProject: true,               // ✅ Projeyi görebilir
        canEditProject: false,              // ❌ Proje düzenleyemez
        canViewAllSections: false,          // ❌ Sadece görevin bulunduğu bölümü görebilir
        canViewAllTasks: false,             // ❌ Sadece atandığı görevi görebilir
        canCreateTask: false,               // ❌ Görev oluşturamaz
        canCreateSection: false,            // ❌ Bölüm oluşturamaz
        canAssignTasks: false,              // ❌ Atama yapamaz
        canCompleteTask: false,             // ❌ Direkt tamamlayamaz
        canSubmitForApproval: true          // ✅ Onaya gönderebilir
      }

    default:
      return basePermissions
  }
}

/**
 * Görülebilir içeriği hesaplar
 */
async function calculateVisibleContent(
  accessLevel: AccessLevel,
  sectionAssignments: string[],
  taskAssignments: string[],
  projectId: string
) {
  let visibleSectionIds: string[] = []
  let visibleTaskIds: string[] = []

  switch (accessLevel) {
    case 'OWNER':
    case 'PROJECT_MEMBER':
    case 'PROJECT_ASSIGNED':
      // Tüm bölümler ve görevler görülebilir - API'den gelecek
      visibleSectionIds = []  // Boş array = hepsini göster
      visibleTaskIds = []     // Boş array = hepsini göster
      break

    case 'SECTION_ASSIGNED':
      // Sadece atanmış bölümler ve o bölümlerdeki görevler
      visibleSectionIds = sectionAssignments
      
      // Bu bölümlerdeki tüm görevleri getir
      if (sectionAssignments.length > 0) {
        const tasks = await withReadRetry(async () =>
          db.task.findMany({
            where: {
              projectId: projectId,
              sectionId: { in: sectionAssignments }
            },
            select: { id: true }
          })
        )
        visibleTaskIds = tasks.map(task => task.id)
      }
      break

    case 'TASK_ASSIGNED':
      // Sadece atanmış görevler ve onların bulunduğu bölümler
      visibleTaskIds = taskAssignments
      
      // Bu görevlerin bulunduğu bölümleri getir
      if (taskAssignments.length > 0) {
        const tasks = await withReadRetry(async () =>
          db.task.findMany({
            where: {
              id: { in: taskAssignments },
              projectId: projectId
            },
            select: { sectionId: true }
          })
        )
        
        // Unique section ID'leri al
        const sectionIds = tasks
          .map(task => task.sectionId)
          .filter((id, index, arr) => id && arr.indexOf(id) === index) as string[]
        
        visibleSectionIds = sectionIds
      }
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
      canDeleteProject: false,
      canCompleteTask: false,
      canSubmitForApproval: false
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

  // N+1 Query sorunu çözümü: Bulk access kontrolü ve pin bilgilerini getir
  const projectIds = projects.map(p => p.id)
  
  // Tüm proje pin bilgilerini bir sorguda al
  const allProjectPins = await withReadRetry(async () =>
    db.userPin.findMany({
      where: {
        userId: userId,
        targetType: 'PROJECT',
        targetId: { in: projectIds }
      }
    })
  )

  // Pin set'ini oluştur
  const pinnedProjectSet = new Set(allProjectPins.map(pin => pin.targetId))
  
  // Tüm assignment verilerini bulk olarak getir
  const allUserAssignments = await withReadRetry(async () =>
    db.assignment.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE',
        OR: [
          { targetType: 'PROJECT', targetId: { in: projectIds } },
          { targetType: 'SECTION' },
          { targetType: 'TASK' }
        ]
      }
    })
  )
  
  // Project member bilgilerini bulk olarak getir
  const allProjectMembers = await withReadRetry(async () =>
    db.projectMember.findMany({
      where: { 
        projectId: { in: projectIds },
        userId: userId 
      }
    })
  )

  // Bulk data'yı grupla
  const assignmentsByProject = new Map<string, any[]>()
  const membersByProject = new Map<string, any>()
  
  allUserAssignments.forEach(assignment => {
    if (assignment.targetType === 'PROJECT') {
      if (!assignmentsByProject.has(assignment.targetId)) {
        assignmentsByProject.set(assignment.targetId, [])
      }
      assignmentsByProject.get(assignment.targetId)!.push(assignment)
    }
  })
  
  allProjectMembers.forEach(member => {
    membersByProject.set(member.projectId, member)
  })

  // Her proje için access level hesapla (optimized)
  const projectsWithAccess = projects.map(project => {
    // Basit access level hesaplaması
    const isOwner = project.userId === userId
    const member = membersByProject.get(project.id)
    const projectAssignments = assignmentsByProject.get(project.id) || []
    
    let accessLevel: AccessLevel
    if (isOwner) {
      accessLevel = 'OWNER'
    } else if (member) {
      accessLevel = 'PROJECT_MEMBER'
    } else if (projectAssignments.length > 0) {
      accessLevel = 'PROJECT_ASSIGNED'
    } else {
      accessLevel = 'NO_ACCESS'
    }

    // Simplified permissions (daha detaylı hesaplama gerekirse ayrı fonksiyon)
    const permissions = calculatePermissions(accessLevel, member?.role, 'COLLABORATOR')

    return {
      ...project,
      userAccess: {
        accessLevel,
        isProjectOwner: isOwner,
        projectAssignment: projectAssignments[0] || null,
        sectionAssignments: [],
        taskAssignments: [],
        permissions,
        visibleContent: {
          sectionIds: [],
          taskIds: []
        }
      },
      isPinned: pinnedProjectSet.has(project.id)
    }
  })

  return projectsWithAccess
}

/**
 * Middleware için hızlı erişim kontrolü
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const access = await getUserProjectAccess(userId, projectId)
  return access.accessLevel !== 'NO_ACCESS'
}