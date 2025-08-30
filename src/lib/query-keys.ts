// Standardized query keys for consistent caching across the application

export const QUERY_KEYS = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...QUERY_KEYS.projects.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...QUERY_KEYS.projects.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.projects.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.projects.details(), id] as const,
    sections: (projectId: string) => [...QUERY_KEYS.projects.all, 'sections', projectId] as const,
    activities: (projectId: string) => [...QUERY_KEYS.projects.all, 'activities', projectId] as const,
    members: (projectId: string) => [...QUERY_KEYS.projects.all, 'members', projectId] as const,
  },
  
  // Tasks  
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...QUERY_KEYS.tasks.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...QUERY_KEYS.tasks.lists(), { filters }] as const,
    details: () => [...QUERY_KEYS.tasks.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.tasks.details(), id] as const,
    byProject: (projectId: string) => [...QUERY_KEYS.tasks.all, 'project', projectId] as const,
    bySection: (sectionId: string) => [...QUERY_KEYS.tasks.all, 'section', sectionId] as const,
    comments: (taskId: string) => [...QUERY_KEYS.tasks.all, 'comments', taskId] as const,
  },
  
  // Sections
  sections: {
    all: ['sections'] as const,
    lists: () => [...QUERY_KEYS.sections.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.sections.all, 'detail', id] as const,
    byProject: (projectId: string) => [...QUERY_KEYS.sections.all, 'project', projectId] as const,
  },
  
  // Users & Auth
  auth: {
    user: ['auth', 'user'] as const,
    status: ['auth', 'status'] as const,
  },
  
  // Tags
  tags: {
    all: ['tags'] as const,
    lists: () => [...QUERY_KEYS.tags.all, 'list'] as const,
  },
  
  // Google Integration
  google: {
    authStatus: ['google', 'auth', 'status'] as const,
    calendar: ['google', 'calendar'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...QUERY_KEYS.notifications.all, 'list'] as const,
    unread: () => [...QUERY_KEYS.notifications.all, 'unread'] as const,
  }
} as const

// Helper functions for query key management
export const queryKeyUtils = {
  // Check if a key belongs to a specific domain
  isProjectKey: (key: readonly unknown[]) => key[0] === 'projects',
  isTaskKey: (key: readonly unknown[]) => key[0] === 'tasks',
  isSectionKey: (key: readonly unknown[]) => key[0] === 'sections',
  
  // Extract ID from detail keys
  extractProjectId: (key: readonly unknown[]) => {
    if (queryKeyUtils.isProjectKey(key) && key[1] === 'detail' && typeof key[2] === 'string') {
      return key[2]
    }
    return null
  },
  
  extractTaskId: (key: readonly unknown[]) => {
    if (queryKeyUtils.isTaskKey(key) && key[1] === 'detail' && typeof key[2] === 'string') {
      return key[2]
    }
    return null
  },
  
  // Generate invalidation patterns
  getAllProjectKeys: (projectId?: string) => {
    if (projectId) {
      return [
        QUERY_KEYS.projects.detail(projectId),
        QUERY_KEYS.projects.sections(projectId),
        QUERY_KEYS.projects.activities(projectId),
        QUERY_KEYS.projects.members(projectId),
        QUERY_KEYS.tasks.byProject(projectId),
      ]
    }
    return [QUERY_KEYS.projects.all]
  },
  
  getAllTaskKeys: (taskId?: string, projectId?: string) => {
    const keys = []
    if (taskId) {
      keys.push(
        QUERY_KEYS.tasks.detail(taskId),
        QUERY_KEYS.tasks.comments(taskId)
      )
    }
    if (projectId) {
      keys.push(QUERY_KEYS.tasks.byProject(projectId))
    }
    if (!taskId && !projectId) {
      keys.push(QUERY_KEYS.tasks.all)
    }
    return keys
  }
}

// Cache invalidation strategies
export const invalidationStrategies = {
  // When a project is created/updated/deleted
  onProjectChange: (projectId?: string) => {
    return [
      QUERY_KEYS.projects.lists(),
      ...(projectId ? queryKeyUtils.getAllProjectKeys(projectId) : [])
    ]
  },
  
  // When a task is created/updated/deleted
  onTaskChange: (taskId?: string, projectId?: string) => {
    return [
      QUERY_KEYS.tasks.lists(),
      ...queryKeyUtils.getAllTaskKeys(taskId, projectId),
      ...(projectId ? [QUERY_KEYS.projects.detail(projectId)] : [])
    ]
  },
  
  // When a section is created/updated/deleted
  onSectionChange: (sectionId?: string, projectId?: string) => {
    const keys = [QUERY_KEYS.sections.lists()]
    if (sectionId) {
      keys.push(QUERY_KEYS.sections.detail(sectionId))
    }
    if (projectId) {
      keys.push(
        QUERY_KEYS.projects.sections(projectId),
        QUERY_KEYS.sections.byProject(projectId),
        QUERY_KEYS.projects.detail(projectId)
      )
    }
    return keys
  },
  
  // When user assignment changes
  onAssignmentChange: (projectId: string, taskId?: string) => {
    return [
      QUERY_KEYS.projects.members(projectId),
      QUERY_KEYS.projects.detail(projectId),
      ...(taskId ? [QUERY_KEYS.tasks.detail(taskId)] : [])
    ]
  }
}