import { create } from 'zustand'
import type { Task, CreateTaskRequest, CreateTaskResponse } from '@/types/task'
import { getTaskDateStatus, isTaskDueInCurrentWeek } from '@/lib/date-utils'

interface TaskWithRelations extends Omit<Task, 'createdAt' | 'updatedAt' | 'dueDate' | 'tags'> {
  createdAt: string
  updatedAt: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  level: number
  taskType?: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE'  // Görev türü
  calendarSourceId?: string                          // Google Calendar kaynak ID'si
  quickNoteCategory?: string                         // Hızlı Not kategorisi
  tags?: Array<{
    id: string
    taskId: string
    tagId: string
    tag: {
      id: string
      name: string
      color: string
      userId: string
      createdAt: Date
      updatedAt: Date
    }
  }>
  assignments?: Array<{
    id: string
    targetType: 'PROJECT' | 'SECTION' | 'TASK'
    targetId: string
    userId?: string
    email?: string
    assignedBy: string
    status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED'
    assignedAt: string
    user?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    assigner: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  subTasks?: TaskWithRelations[]
  project?: {
    id: string
    name: string
    emoji?: string
  }
  section?: {
    id: string
    name: string
    projectId: string
  }
  _count?: {
    comments: number
  }
}

interface TaskStore {
  tasks: TaskWithRelations[]
  isLoading: boolean
  error: string | null
  showCompletedTasks: boolean
  lastFetchTime: number
  
  // Actions
  fetchTasks: () => Promise<void>
  fetchTasksByProject: (projectId: string) => Promise<TaskWithRelations[]>
  fetchTasksByTag: (tagId: string) => Promise<TaskWithRelations[]>
  createTask: (taskData: CreateTaskRequest) => Promise<CreateTaskResponse | null>
  updateTask: (id: string, updates: Partial<TaskWithRelations>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  undoDeleteTask: (taskData: TaskWithRelations) => Promise<void>
  cloneTask: (id: string, targetProjectId?: string, targetSectionId?: string | null) => Promise<void>
  moveTask: (id: string, targetProjectId: string, targetSectionId: string | null) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  
  // New task features
  toggleTaskPin: (taskId: string) => Promise<void>
  addSubTask: (parentTaskId: string, taskData: CreateTaskRequest) => Promise<void>
  updateTaskTags: (taskId: string, tagIds: string[]) => Promise<void>
  refreshTaskCommentCount: (taskId: string) => Promise<void>
  
  // Optimistic UI helpers
  optimisticTaskUpdate: (taskId: string, updates: Partial<TaskWithRelations>) => void
  revertOptimisticUpdate: (taskId: string, originalTask: TaskWithRelations) => void
  
  // Assignment methods
  // DEPRECATED: Use /api/assignments endpoint instead
  // assignUser: (taskId: string, userId: string) => Promise<void>
  // unassignUser: (taskId: string, userId: string) => Promise<void>
  getAssignedTasks: (userId?: string) => TaskWithRelations[]
  
  // Utility methods
  getTasksByProject: (projectId: string) => TaskWithRelations[]
  getTasksByTag: (tagId: string) => TaskWithRelations[]
  getTasksBySection: (sectionId: string) => TaskWithRelations[]
  getTasksWithoutSection: (projectId: string) => TaskWithRelations[]
  getPinnedTasks: () => TaskWithRelations[]
  getSubTasks: (parentTaskId: string) => TaskWithRelations[]
  getTaskById: (taskId: string) => TaskWithRelations | undefined
  getCompletedTasksCount: (projectId: string) => number
  getPendingTasksCount: (projectId: string) => number
  getProjectCompletionPercentage: (projectId: string) => number
  getCompletedTasksCountByTag: (tagId: string) => number
  getPendingTasksCountByTag: (tagId: string) => number
  toggleShowCompletedTasks: () => void
  clearError: () => void
  
  // TaskType filtreleme metodları
  getTasksByType: (taskType: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE') => TaskWithRelations[]
  getCalendarTasks: () => TaskWithRelations[]
  getQuickNoteTasks: () => TaskWithRelations[]
  getProjectTasks: () => TaskWithRelations[]
  getCalendarTasksBySource: (calendarSourceId: string) => TaskWithRelations[]
  getQuickNoteTasksByCategory: (category: string) => TaskWithRelations[]
  
  // Overdue and date-based filtering
  getOverdueTasks: () => TaskWithRelations[]
  getOverdueTasksByProject: (projectId: string) => TaskWithRelations[]
  getTasksDueToday: () => TaskWithRelations[]
  getTasksDueTomorrow: () => TaskWithRelations[]
  getTasksDueSoon: () => TaskWithRelations[]
  getOverdueTasksCount: () => number
  getOverdueTasksCountByProject: (projectId: string) => number
  getTasksDueThisWeek: () => TaskWithRelations[]
  getTasksDueThisWeekCount: () => number
  getCurrentWeekTasks: () => TaskWithRelations[]
  getCurrentWeekTasksCount: () => number
  getScheduledTasks: () => TaskWithRelations[]
  getScheduledTasksCount: () => number
  
  // Completed tasks helpers
  getCompletedTasks: () => TaskWithRelations[]
  getCompletedTasksToday: () => TaskWithRelations[]
  getCompletedTasksThisWeek: () => TaskWithRelations[]
  getCompletedTasksThisMonth: () => TaskWithRelations[]
  getTotalCompletedTasksCount: () => number
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  showCompletedTasks: false,
  lastFetchTime: 0,

  fetchTasks: async () => {
    const state = get()
    const now = Date.now()
    
    // Throttle: Aynı API'yi 2 saniye içinde tekrar çağırma
    if (state.isLoading || (now - state.lastFetchTime) < 2000) {
      console.log('TaskStore fetchTasks throttled - too soon or already loading')
      return
    }
    
    set({ isLoading: true, error: null, lastFetchTime: now })
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 saniye timeout - yavaş database için

      const response = await fetch('/api/tasks', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasks = await response.json()
      set({ tasks, isLoading: false })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        set({ 
          error: 'Görevler yüklenirken zaman aşımı oluştu', 
          isLoading: false 
        })
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'An error occurred', 
          isLoading: false 
        })
      }
    }
  },

  fetchTasksByProject: async (projectId: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project tasks')
      }
      const tasks = await response.json()
      
      // Update store with new tasks (merge with existing tasks from other projects)
      set(state => ({
        tasks: [
          ...state.tasks.filter(task => task.projectId !== projectId),
          ...tasks
        ]
      }))
      
      return tasks
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  fetchTasksByTag: async (tagId: string) => {
    set({ error: null })
    try {
      console.log('Fetching tasks for tag:', tagId)
      const response = await fetch(`/api/tags/${tagId}/tasks`)
      console.log('Response status:', response.status)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch tag tasks')
      }
      const tasks = await response.json()
      
      // Update store with tasks that have this tag
      set(state => {
        const existingTaskIds = new Set(tasks.map((task: TaskWithRelations) => task.id))
        return {
          tasks: [
            ...state.tasks.filter(task => 
              !task.tags?.some(tagRel => tagRel.tagId === tagId) || 
              existingTaskIds.has(task.id)
            ),
            ...tasks.filter((task: TaskWithRelations) => 
              !state.tasks.some(existing => existing.id === task.id)
            )
          ]
        }
      })
      
      return tasks
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  createTask: async (taskData: CreateTaskRequest) => {
    set({ error: null })
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }
      
      const newTask = await response.json() as CreateTaskResponse
      
      // Add new task to store and update parent task if this is a subtask
      set(state => {
        let updatedTasks = [newTask, ...state.tasks]
        
        // Eğer bu bir alt görevse, parent task'ın subTasks array'ini güncelle
        if (newTask.parentTaskId) {
          updatedTasks = updatedTasks.map(task => {
            if (task.id === newTask.parentTaskId) {
              return {
                ...task,
                subTasks: [
                  ...(task.subTasks || []),
                  {
                    id: newTask.id,
                    title: newTask.title,
                    completed: newTask.completed,
                    priority: newTask.priority,
                    createdAt: newTask.createdAt,
                    updatedAt: newTask.updatedAt
                  }
                ]
              }
            }
            return task
          })
        }
        
        return { tasks: updatedTasks }
      })
      
      return newTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  updateTask: async (id: string, updates: Partial<TaskWithRelations>) => {
    set({ error: null })
    
    // Find current task state
    const state = get()
    const task = state.tasks.find(t => t.id === id)
    if (!task) return
    
    const originalTask = { ...task }
    
    // 1. Optimistic update - instant UI change
    get().optimisticTaskUpdate(id, updates)
    
    try {
      // 2. API call
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        // 3. API failed - revert optimistic update
        get().revertOptimisticUpdate(id, originalTask)
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }
      
      // 4. API success - sync with server state
      const updatedTask = await response.json()
      get().optimisticTaskUpdate(id, updatedTask)
      
    } catch (error) {
      // 5. Error handling - ensure state is reverted
      get().revertOptimisticUpdate(id, originalTask)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null })
    
    // Find current task state
    const state = get()
    const taskToDelete = state.tasks.find(t => t.id === id)
    if (!taskToDelete) return
    
    const originalTasks = [...state.tasks]
    
    // 1. Optimistic update - instant removal
    const filteredTasks = state.tasks.filter(task => task.id !== id)
    
    // Update parent task's subTasks if this was a subtask
    const updatedTasks = taskToDelete.parentTaskId 
      ? filteredTasks.map(task => {
          if (task.id === taskToDelete.parentTaskId) {
            return {
              ...task,
              subTasks: (task.subTasks || []).filter(subTask => subTask.id !== id)
            }
          }
          return task
        })
      : filteredTasks
    
    set({ tasks: updatedTasks })
    
    try {
      // 2. API call
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        // 3. API failed - restore task
        set({ tasks: originalTasks })
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
      
      // 4. API success - optimistic update is already applied
      // Optionally show undo notification here
      
    } catch (error) {
      // 5. Error handling - restore original state
      set({
        tasks: originalTasks,
        error: error instanceof Error ? error.message : 'An error occurred'
      })
      throw error
    }
  },
  
  // Undo delete functionality (for future use)
  undoDeleteTask: async (taskData: TaskWithRelations) => {
    // This would be called if user clicks "Undo" within 5 seconds
    // For now, just restore to local state - API recreation could be complex
    set(state => ({
      tasks: [...state.tasks, taskData].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }))
  },

  cloneTask: async (id: string, targetProjectId?: string, targetSectionId?: string | null) => {
    set({ error: null })
    try {
      const body = targetProjectId ? {
        targetProjectId,
        targetSectionId
      } : {}
      
      const response = await fetch(`/api/tasks/${id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clone task')
      }
      
      const clonedTask = await response.json()
      
      // Yeni klonlanan görevi ve tüm alt görevlerini store'a ekle
      set(state => {
        const newTasks = [clonedTask]
        
        // Alt görevleri de ayrı olarak ekle
        if (clonedTask.subTasks && clonedTask.subTasks.length > 0) {
          newTasks.push(...clonedTask.subTasks)
        }
        
        return {
          tasks: [...state.tasks, ...newTasks]
        }
      })

      // Başarı mesajı göster
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  moveTask: async (id: string, targetProjectId: string, targetSectionId: string | null) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/tasks/${id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetProjectId,
          targetSectionId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to move task')
      }
      
      const updatedTask = await response.json()
      
      // Store'daki görevi güncelle ve alt görevleri de güncelle
      set(state => {
        const updatedTasks = state.tasks.map(task => {
          // Ana görev ise güncelle
          if (task.id === id) {
            return {
              ...task,
              projectId: targetProjectId,
              sectionId: targetSectionId,
              updatedAt: new Date().toISOString()
            }
          }
          // Alt görev ise güncelle
          if (task.parentTaskId === id) {
            return {
              ...task,
              projectId: targetProjectId,
              sectionId: targetSectionId,
              updatedAt: new Date().toISOString()
            }
          }
          return task
        })
        
        return { tasks: updatedTasks }
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  toggleTaskComplete: async (id: string) => {
    const state = get()
    const task = state.tasks.find(t => t.id === id)
    if (!task) return
    
    const willBeCompleted = !task.completed
    
    // Eğer parent task complete edilmeye çalışılıyorsa, tüm children'ların durumunu kontrol et
    if (willBeCompleted) {
      const children = state.tasks.filter(t => t.parentTaskId === id)
      if (children.length > 0) {
        const hasIncompleteChildren = children.some(child => !child.completed)
        if (hasIncompleteChildren) {
          return
        }
      }
    }
    
    // Task'ı güncelle
    await state.updateTask(id, { completed: willBeCompleted })
    
    // Eğer task complete ediliyor ve children varsa, onları da complete et
    if (willBeCompleted) {
      const children = state.tasks.filter(t => t.parentTaskId === id)
      for (const child of children) {
        if (!child.completed) {
          await state.updateTask(child.id, { completed: true })
        }
      }
    }
    
    // Alt görevler tamamlandığında ana görevi otomatik tamamlama - kaldırıldı
    // Kullanıcı ana görevi manuel olarak tamamlamalıdır
    
    // Eğer child task incomplete ediliyor ve parent complete ise, parent'ı da incomplete et
    if (!willBeCompleted && task.parentTaskId) {
      const parent = state.tasks.find(t => t.id === task.parentTaskId)
      if (parent?.completed) {
        await state.updateTask(task.parentTaskId, { completed: false })
      }
    }
    
    // Alt görev durumu değiştiğinde, parent task'ın subTasks array'ini güncelle
    if (task.parentTaskId) {
      set(prevState => ({
        tasks: prevState.tasks.map(t => {
          if (t.id === task.parentTaskId) {
            // Parent task'ın subTasks array'ini güncelle
            const updatedSubTasks = t.subTasks?.map(subTask => 
              subTask.id === id ? { ...subTask, completed: willBeCompleted } : subTask
            ) || []
            return { ...t, subTasks: updatedSubTasks }
          }
          return t
        })
      }))
    }
    
  },

  // Utility methods
  getTasksByProject: (projectId: string) => {
    const { tasks, showCompletedTasks } = get()
    const filteredTasks = tasks.filter(task => 
      task.projectId === projectId && 
      task.taskType === 'PROJECT' &&  // Sadece PROJECT türü görevler
      (showCompletedTasks || !task.completed)
    )
    
    // Recursive function to get all sub-tasks at any level
    const getAllSubTasksRecursive = (parentId: string, level: number = 1): TaskWithRelations[] => {
      const directSubTasks = filteredTasks.filter(task => task.parentTaskId === parentId)
      const result: TaskWithRelations[] = []
      
      directSubTasks.forEach(subTask => {
        // Add current sub-task with level information
        const taskWithLevel = { ...subTask, level }
        result.push(taskWithLevel)
        
        // Recursively add its sub-tasks
        const nestedSubTasks = getAllSubTasksRecursive(subTask.id, level + 1)
        result.push(...nestedSubTasks)
      })
      
      return result
    }
    
    // Ana görevleri ve tüm alt görevleri hierarchical sırayla döndür
    const mainTasks = filteredTasks.filter(task => !task.parentTaskId)
    const result: TaskWithRelations[] = []
    
    mainTasks.forEach(mainTask => {
      result.push({ ...mainTask, level: 0 })
      // Bu ana görevin tüm alt görevlerini recursive şekilde ekle
      const allSubTasks = getAllSubTasksRecursive(mainTask.id)
      result.push(...allSubTasks)
    })
    
    return result
  },

  getTasksByTag: (tagId: string) => {
    const { tasks, showCompletedTasks } = get()
    
    // Bu tag'a sahip TÜM görevleri bul (ana + alt görevler)
    const allTasksWithTag = tasks.filter(task => 
      task.tags?.some(tagRel => tagRel.tagId === tagId) && 
      (showCompletedTasks || !task.completed)
    )
    
    // Ana görevleri ve alt görevleri ayır
    const mainTasksWithTag = allTasksWithTag.filter(task => !task.parentTaskId)
    const subTasksWithTag = allTasksWithTag.filter(task => task.parentTaskId)
    
    // Helper function to find the root parent of a task
    const findRootParent = (taskId: string): TaskWithRelations | null => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return null
      if (!task.parentTaskId) return task
      return findRootParent(task.parentTaskId)
    }
    
    // Helper function to calculate task level from root
    const calculateLevel = (taskId: string): number => {
      const task = tasks.find(t => t.id === taskId)
      if (!task || !task.parentTaskId) return 0
      return 1 + calculateLevel(task.parentTaskId)
    }
    
    // Recursive function to get all sub-tasks at any level
    const getAllSubTasksRecursive = (parentId: string, level: number = 1): TaskWithRelations[] => {
      const directSubTasks = tasks.filter(task => 
        task.parentTaskId === parentId && 
        (showCompletedTasks || !task.completed)
      )
      const result: TaskWithRelations[] = []
      
      directSubTasks.forEach(subTask => {
        // Add current sub-task with level information
        const taskWithLevel = { ...subTask, level }
        result.push(taskWithLevel)
        
        // Recursively add its sub-tasks
        const nestedSubTasks = getAllSubTasksRecursive(subTask.id, level + 1)
        result.push(...nestedSubTasks)
      })
      
      return result
    }
    
    const result: TaskWithRelations[] = []
    const processedTasks = new Set<string>()
    
    // 1. Önce ana görevleri işle (tag'a sahip olanlar)
    mainTasksWithTag.forEach(mainTask => {
      if (!processedTasks.has(mainTask.id)) {
        result.push({ ...mainTask, level: 0 })
        processedTasks.add(mainTask.id)
        
        // Bu ana görevin tüm alt görevlerini ekle
        const allSubTasks = getAllSubTasksRecursive(mainTask.id)
        allSubTasks.forEach(subTask => {
          processedTasks.add(subTask.id)
        })
        result.push(...allSubTasks)
      }
    })
    
    // 2. Sonra tag'a sahip alt görevleri işle (henüz eklenmemişlerse)
    subTasksWithTag.forEach(subTask => {
      if (!processedTasks.has(subTask.id)) {
        // Bu alt görevin root parent'ını bul
        const rootParent = findRootParent(subTask.id)
        if (rootParent && !processedTasks.has(rootParent.id)) {
          // Root parent'ı ekle
          result.push({ ...rootParent, level: 0 })
          processedTasks.add(rootParent.id)
          
          // Root parent'ın tüm alt görevlerini ekle
          const allSubTasks = getAllSubTasksRecursive(rootParent.id)
          allSubTasks.forEach(subTask => {
            processedTasks.add(subTask.id)
          })
          result.push(...allSubTasks)
        }
      }
    })
    
    return result
  },

  getTasksBySection: (sectionId: string) => {
    const { tasks, showCompletedTasks } = get()
    const filteredTasks = tasks.filter(task => 
      task.sectionId === sectionId && 
      (showCompletedTasks || !task.completed)
    )
    
    // Recursive function to get all sub-tasks at any level
    const getAllSubTasksRecursive = (parentId: string, level: number = 1): TaskWithRelations[] => {
      // ALT GÖREVLER İÇİN TÜM TASK'LARI ARA - sectionId filtresiz
      const directSubTasks = tasks.filter(task => 
        task.parentTaskId === parentId && 
        (showCompletedTasks || !task.completed)
      )
      const result: TaskWithRelations[] = []
      
      directSubTasks.forEach(subTask => {
        // Add current sub-task with level information
        const taskWithLevel = { ...subTask, level }
        result.push(taskWithLevel)
        
        // Recursively add its sub-tasks
        const nestedSubTasks = getAllSubTasksRecursive(subTask.id, level + 1)
        result.push(...nestedSubTasks)
      })
      
      return result
    }
    
    // Ana görevleri ve tüm alt görevleri hierarchical sırayla döndür
    const mainTasks = filteredTasks.filter(task => !task.parentTaskId)
    const result: TaskWithRelations[] = []
    
    mainTasks.forEach(mainTask => {
      result.push({ ...mainTask, level: 0 })
      // Bu ana görevin tüm alt görevlerini recursive şekilde ekle
      const allSubTasks = getAllSubTasksRecursive(mainTask.id)
      result.push(...allSubTasks)
    })
    
    return result
  },

  getTasksWithoutSection: (projectId: string) => {
    const { tasks, showCompletedTasks } = get()
    const filteredTasks = tasks.filter(task => 
      task.projectId === projectId &&
      task.sectionId === null && 
      (showCompletedTasks || !task.completed)
    )
    
    // Recursive function to get all sub-tasks at any level
    const getAllSubTasksRecursive = (parentId: string, level: number = 1): TaskWithRelations[] => {
      // ALT GÖREVLER İÇİN TÜM TASK'LARI ARA - sectionId filtresiz
      const directSubTasks = tasks.filter(task => 
        task.parentTaskId === parentId && 
        (showCompletedTasks || !task.completed)
      )
      const result: TaskWithRelations[] = []
      
      directSubTasks.forEach(subTask => {
        // Add current sub-task with level information
        const taskWithLevel = { ...subTask, level }
        result.push(taskWithLevel)
        
        // Recursively add its sub-tasks
        const nestedSubTasks = getAllSubTasksRecursive(subTask.id, level + 1)
        result.push(...nestedSubTasks)
      })
      
      return result
    }
    
    // Ana görevleri ve tüm alt görevleri hierarchical sırayla döndür
    const mainTasks = filteredTasks.filter(task => !task.parentTaskId)
    const result: TaskWithRelations[] = []
    
    mainTasks.forEach(mainTask => {
      result.push({ ...mainTask, level: 0 })
      // Bu ana görevin tüm alt görevlerini recursive şekilde ekle
      const allSubTasks = getAllSubTasksRecursive(mainTask.id)
      result.push(...allSubTasks)
    })
    
    return result
  },

  getPinnedTasks: () => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => 
      task.isPinned && 
      (showCompletedTasks || !task.completed)
    )
  },

  getSubTasks: (parentTaskId: string) => {
    const { tasks } = get()
    
    // Recursive function to get all sub-tasks at any level
    const getAllSubTasksRecursive = (parentId: string): TaskWithRelations[] => {
      const directSubTasks = tasks.filter(task => task.parentTaskId === parentId)
      const result: TaskWithRelations[] = []
      
      directSubTasks.forEach(subTask => {
        result.push(subTask)
        // Recursively add its sub-tasks
        const nestedSubTasks = getAllSubTasksRecursive(subTask.id)
        result.push(...nestedSubTasks)
      })
      
      return result
    }
    
    return getAllSubTasksRecursive(parentTaskId)
  },

  getTaskById: (taskId: string) => {
    return get().tasks.find(task => task.id === taskId)
  },

  getCompletedTasksCount: (projectId: string) => {
    return get().tasks.filter(task => 
      task.projectId === projectId && 
      task.completed
    ).length
  },

  getPendingTasksCount: (projectId: string) => {
    return get().tasks.filter(task => 
      task.projectId === projectId && 
      !task.completed
    ).length
  },

  getCompletedTasksCountByTag: (tagId: string) => {
    const { tasks } = get()
    
    // Bu tag'a sahip TÜM görevleri bul (ana + alt görevler)
    const allTasksWithTag = tasks.filter(task => 
      task.tags?.some(tagRel => tagRel.tagId === tagId)
    )
    
    const processedTasks = new Set<string>()
    let totalCount = 0
    
    // Helper function to find the root parent of a task
    const findRootParent = (taskId: string): string | null => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return null
      if (!task.parentTaskId) return task.id
      return findRootParent(task.parentTaskId)
    }
    
    // Recursive function to count all sub-tasks
    const countAllSubTasks = (parentId: string): number => {
      const directSubTasks = tasks.filter(task => task.parentTaskId === parentId)
      let count = 0
      
      directSubTasks.forEach(subTask => {
        if (subTask.completed) count++
        processedTasks.add(subTask.id)
        // Recursively count its sub-tasks
        count += countAllSubTasks(subTask.id)
      })
      
      return count
    }
    
    // Ana görevleri işle
    allTasksWithTag.filter(task => !task.parentTaskId).forEach(mainTask => {
      if (!processedTasks.has(mainTask.id)) {
        if (mainTask.completed) totalCount++
        processedTasks.add(mainTask.id)
        totalCount += countAllSubTasks(mainTask.id)
      }
    })
    
    // Alt görevleri işle (henüz işlenmemişlerse)
    allTasksWithTag.filter(task => task.parentTaskId).forEach(subTask => {
      if (!processedTasks.has(subTask.id)) {
        const rootParentId = findRootParent(subTask.id)
        if (rootParentId && !processedTasks.has(rootParentId)) {
          const rootParent = tasks.find(t => t.id === rootParentId)
          if (rootParent) {
            if (rootParent.completed) totalCount++
            processedTasks.add(rootParent.id)
            totalCount += countAllSubTasks(rootParent.id)
          }
        }
      }
    })
    
    return totalCount
  },

  getPendingTasksCountByTag: (tagId: string) => {
    const { tasks } = get()
    
    // Bu tag'a sahip TÜM görevleri bul (ana + alt görevler)
    const allTasksWithTag = tasks.filter(task => 
      task.tags?.some(tagRel => tagRel.tagId === tagId)
    )
    
    const processedTasks = new Set<string>()
    let totalCount = 0
    
    // Helper function to find the root parent of a task
    const findRootParent = (taskId: string): string | null => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return null
      if (!task.parentTaskId) return task.id
      return findRootParent(task.parentTaskId)
    }
    
    // Recursive function to count all sub-tasks
    const countAllSubTasks = (parentId: string): number => {
      const directSubTasks = tasks.filter(task => task.parentTaskId === parentId)
      let count = 0
      
      directSubTasks.forEach(subTask => {
        if (!subTask.completed) count++
        processedTasks.add(subTask.id)
        // Recursively count its sub-tasks
        count += countAllSubTasks(subTask.id)
      })
      
      return count
    }
    
    // Ana görevleri işle
    allTasksWithTag.filter(task => !task.parentTaskId).forEach(mainTask => {
      if (!processedTasks.has(mainTask.id)) {
        if (!mainTask.completed) totalCount++
        processedTasks.add(mainTask.id)
        totalCount += countAllSubTasks(mainTask.id)
      }
    })
    
    // Alt görevleri işle (henüz işlenmemişlerse)
    allTasksWithTag.filter(task => task.parentTaskId).forEach(subTask => {
      if (!processedTasks.has(subTask.id)) {
        const rootParentId = findRootParent(subTask.id)
        if (rootParentId && !processedTasks.has(rootParentId)) {
          const rootParent = tasks.find(t => t.id === rootParentId)
          if (rootParent) {
            if (!rootParent.completed) totalCount++
            processedTasks.add(rootParent.id)
            totalCount += countAllSubTasks(rootParent.id)
          }
        }
      }
    })
    
    return totalCount
  },

  toggleTaskPin: async (taskId: string) => {
    set({ error: null })
    
    // Find current task state
    const state = get()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) return
    
    const originalPinned = task.isPinned
    const newPinned = !originalPinned
    
    // 1. Optimistic update - instant UI change
    get().optimisticTaskUpdate(taskId, { isPinned: newPinned })
    
    try {
      // 2. API call
      const response = await fetch(`/api/tasks/${taskId}/pin`, {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        // 3. API failed - revert optimistic update
        get().revertOptimisticUpdate(taskId, task)
        
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle pin')
      }
      
      // 4. API success - verify server state (optional)
      const updatedTask = await response.json()
      get().optimisticTaskUpdate(taskId, { isPinned: updatedTask.isPinned })
      
    } catch (error) {
      // 5. Error handling - ensure state is reverted
      get().revertOptimisticUpdate(taskId, task)
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  addSubTask: async (parentTaskId: string, taskData: CreateTaskRequest) => {
    set({ error: null })
    try {
      const subTaskData = {
        ...taskData,
        parentTaskId
      }
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subTaskData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create sub-task')
      }
      
      const newSubTask = await response.json()
      
      // Add new sub-task to store
      set(state => ({
        tasks: [newSubTask, ...state.tasks]
      }))
      
      return newSubTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },


  updateTaskTags: async (taskId: string, tagIds: string[]) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagIds }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task tags')
      }
      
      const updatedTask = await response.json()
      
      // Update task in store
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updatedTask } : task
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  // Optimistic UI helpers - standardized pattern
  optimisticTaskUpdate: (taskId: string, updates: Partial<TaskWithRelations>) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      )
    }))
  },
  
  revertOptimisticUpdate: (taskId: string, originalTask: TaskWithRelations) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? originalTask : t
      )
    }))
  },

  toggleShowCompletedTasks: () => {
    set(state => ({ showCompletedTasks: !state.showCompletedTasks }))
  },

  clearError: () => set({ error: null }),

  // Overdue and date-based filtering methods
  getOverdueTasks: () => {
    const { tasks } = get()
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false
      const dateStatus = getTaskDateStatus(task.dueDate)
      return dateStatus.isOverdue
    })
  },

  getOverdueTasksByProject: (projectId: string) => {
    const { tasks } = get()
    return tasks.filter(task => {
      if (task.completed || !task.dueDate || task.projectId !== projectId) return false
      const dateStatus = getTaskDateStatus(task.dueDate)
      return dateStatus.isOverdue
    })
  },

  getTasksDueToday: () => {
    const { tasks } = get()
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false
      const dateStatus = getTaskDateStatus(task.dueDate)
      return dateStatus.isDueToday
    })
  },

  getTasksDueTomorrow: () => {
    const { tasks } = get()
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false
      const dateStatus = getTaskDateStatus(task.dueDate)
      return dateStatus.isDueTomorrow
    })
  },

  getTasksDueSoon: () => {
    const { tasks } = get()
    return tasks.filter(task => {
      if (task.completed || !task.dueDate) return false
      const dateStatus = getTaskDateStatus(task.dueDate)
      return dateStatus.status === 'due-soon'
    })
  },

  getOverdueTasksCount: () => {
    return get().getOverdueTasks().length
  },

  getOverdueTasksCountByProject: (projectId: string) => {
    return get().getOverdueTasksByProject(projectId).length
  },

  getTasksDueThisWeek: () => {
    const { tasks } = get()
    return tasks.filter(task => 
      !task.completed && 
      !task.parentTaskId && // Sadece ana görevler
      isTaskDueInCurrentWeek(task.dueDate)
    )
  },

  getTasksDueThisWeekCount: () => {
    return get().getTasksDueThisWeek().length
  },

  // /scheduled sayfası ile exact aynı haftalık hesaplama
  getCurrentWeekTasks: () => {
    const { tasks } = get()
    const today = new Date()
    
    // Hafta günlerini al (Pazartesi başlangıç)
    const getWeekDays = (date: Date) => {
      const startOfWeek = new Date(date)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Pazartesi başlangıç
      startOfWeek.setDate(diff)
      
      const days = []
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek)
        day.setDate(startOfWeek.getDate() + i)
        days.push(day)
      }
      return days
    }
    
    // Belirli tarihteki görevleri al
    const getTasksForDate = (date: Date) => {
      const dateStr = date.getFullYear() + '-' + 
                     String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(date.getDate()).padStart(2, '0')
      
      return tasks.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        const taskDateStr = taskDate.getFullYear() + '-' + 
                           String(taskDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(taskDate.getDate()).padStart(2, '0')
        return taskDateStr === dateStr
      })
    }
    
    const weekDays = getWeekDays(today)
    return weekDays.flatMap(day => getTasksForDate(day))
  },

  getCurrentWeekTasksCount: () => {
    return get().getCurrentWeekTasks().length
  },

  getScheduledTasks: () => {
    const { tasks } = get()
    return tasks.filter(task => task.dueDate) // Tüm görevler (ana + alt) - /scheduled sayfası ile aynı mantık
  },

  getScheduledTasksCount: () => {
    return get().getScheduledTasks().length
  },

  getProjectCompletionPercentage: (projectId: string) => {
    const { tasks } = get()
    
    // Projeye ait tüm görevleri al (ana görevler ve alt görevler dahil)
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    
    if (projectTasks.length === 0) return 0
    
    // Tamamlanan görev sayısını hesapla
    const completedTasks = projectTasks.filter(task => task.completed)
    
    // Yüzde hesapla
    const percentage = Math.round((completedTasks.length / projectTasks.length) * 100)
    
    return percentage
  },

  // Completed tasks helper functions
  getCompletedTasks: () => {
    const { tasks } = get()
    return tasks.filter(task => task.completed)
  },

  getCompletedTasksToday: () => {
    const { tasks } = get()
    const today = new Date()
    const todayStr = today.getFullYear() + '-' + 
                    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(today.getDate()).padStart(2, '0')

    return tasks.filter(task => {
      if (!task.completed || !task.updatedAt) return false
      const taskUpdatedDate = new Date(task.updatedAt)
      const taskDateStr = taskUpdatedDate.getFullYear() + '-' + 
                         String(taskUpdatedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(taskUpdatedDate.getDate()).padStart(2, '0')
      return taskDateStr === todayStr
    })
  },

  getCompletedTasksThisWeek: () => {
    const { tasks } = get()
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    return tasks.filter(task => {
      if (!task.completed || !task.updatedAt) return false
      const taskUpdatedDate = new Date(task.updatedAt)
      return taskUpdatedDate >= startOfWeek
    })
  },

  getCompletedTasksThisMonth: () => {
    const { tasks } = get()
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    return tasks.filter(task => {
      if (!task.completed || !task.updatedAt) return false
      const taskUpdatedDate = new Date(task.updatedAt)
      return taskUpdatedDate >= startOfMonth
    })
  },

  getTotalCompletedTasksCount: () => {
    const { tasks } = get()
    return tasks.filter(task => task.completed).length
  },

  refreshTaskCommentCount: async (taskId: string) => {
    try {
      // Task'ın güncel comment count'unu API'den al
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (response.ok) {
        const comments = await response.json()
        // Ana yorumları ve reply'ları say
        const totalComments = comments.reduce((total: number, comment: Record<string, unknown>) => {
          return total + 1 + (comment.replies?.length || 0)
        }, 0)
        
        // Task'ı güncelle
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskId 
              ? { ...task, _count: { ...task._count, comments: totalComments } }
              : task
          )
        }))
      }
    } catch (error) {
      console.error('Error refreshing task comment count:', error)
    }
  },

  // TaskType filtreleme metodları implementasyonu
  getTasksByType: (taskType: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE') => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => 
      task.taskType === taskType && 
      (showCompletedTasks || !task.completed)
    )
  },

  getCalendarTasks: () => {
    return get().getTasksByType('CALENDAR')
  },

  getQuickNoteTasks: () => {
    return get().getTasksByType('QUICK_NOTE')
  },

  getProjectTasks: () => {
    return get().getTasksByType('PROJECT')
  },

  getCalendarTasksBySource: (calendarSourceId: string) => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => 
      task.taskType === 'CALENDAR' && 
      task.calendarSourceId === calendarSourceId &&
      (showCompletedTasks || !task.completed)
    )
  },

  getQuickNoteTasksByCategory: (category: string) => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => 
      task.taskType === 'QUICK_NOTE' && 
      task.quickNoteCategory === category &&
      (showCompletedTasks || !task.completed)
    )
  },

  // DEPRECATED: Assignment methods - Use /api/assignments endpoint instead
  /*
  // These methods have been removed. Use the new unified assignment system:
  // - POST /api/assignments (create assignment)
  // - DELETE /api/assignments/{id} (remove assignment)
  // - GET /api/assignments (list assignments)
  */

  getAssignedTasks: (userId?: string) => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => {
      if (!showCompletedTasks && task.completed) return false
      
      // Eğer userId verilmemişse, mevcut kullanıcıya atanan görevleri döndür
      // Bu kısım auth store'dan current user ID'si alındığında güncellenebilir
      if (!userId) return false
      
      return task.assignments?.some(assignment => assignment.userId === userId && assignment.status === 'ACTIVE')
    })
  }
}))