import { create } from 'zustand'
import type { Task, CreateTaskRequest, CreateTaskResponse } from '@/types/task'
import { useToastStore } from './toastStore'
import { getTaskDateStatus } from '@/lib/date-utils'

interface TaskWithRelations extends Omit<Task, 'createdAt' | 'updatedAt' | 'dueDate' | 'tags'> {
  createdAt: string
  updatedAt: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  level?: number
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
  reminders?: Array<{
    id: string
    taskId: string
    datetime: Date
    message?: string
    isActive: boolean
  }>
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
}

interface TaskStore {
  tasks: TaskWithRelations[]
  isLoading: boolean
  error: string | null
  showCompletedTasks: boolean
  
  // Actions
  fetchTasks: () => Promise<void>
  fetchTasksByProject: (projectId: string) => Promise<TaskWithRelations[]>
  fetchTasksByTag: (tagId: string) => Promise<TaskWithRelations[]>
  createTask: (taskData: CreateTaskRequest) => Promise<CreateTaskResponse | null>
  updateTask: (id: string, updates: Partial<TaskWithRelations>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  cloneTask: (id: string, targetProjectId?: string, targetSectionId?: string | null) => Promise<void>
  moveTask: (id: string, targetProjectId: string, targetSectionId: string | null) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  
  // New task features
  toggleTaskPin: (taskId: string) => Promise<void>
  addSubTask: (parentTaskId: string, taskData: CreateTaskRequest) => Promise<void>
  updateTaskTags: (taskId: string, tagIds: string[]) => Promise<void>
  updateTaskReminders: (taskId: string, reminders: Array<{
    datetime: Date
    message?: string
    isActive?: boolean
  }>) => Promise<void>
  
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
  getCompletedTasksCountByTag: (tagId: string) => number
  getPendingTasksCountByTag: (tagId: string) => number
  toggleShowCompletedTasks: () => void
  clearError: () => void
  
  // Overdue and date-based filtering
  getOverdueTasks: () => TaskWithRelations[]
  getOverdueTasksByProject: (projectId: string) => TaskWithRelations[]
  getTasksDueToday: () => TaskWithRelations[]
  getTasksDueTomorrow: () => TaskWithRelations[]
  getTasksDueSoon: () => TaskWithRelations[]
  getOverdueTasksCount: () => number
  getOverdueTasksCountByProject: (projectId: string) => number
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  showCompletedTasks: false,

  fetchTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasks = await response.json()
      set({ tasks, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred', 
        isLoading: false 
      })
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
      const response = await fetch(`/api/tags/${tagId}/tasks`)
      if (!response.ok) {
        throw new Error('Failed to fetch tag tasks')
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
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }
      
      const updatedTask = await response.json()
      
      // Update task in store
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...updatedTask } : task
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteTask: async (id: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
      
      // Remove task from store and update parent task if this was a subtask
      set(state => {
        const taskToDelete = state.tasks.find(t => t.id === id)
        const filteredTasks = state.tasks.filter(task => task.id !== id)
        
        // Eğer silinen görev bir alt görevse, parent task'ın subTasks array'ini güncelle
        if (taskToDelete?.parentTaskId) {
          return {
            tasks: filteredTasks.map(task => {
              if (task.id === taskToDelete.parentTaskId) {
                return {
                  ...task,
                  subTasks: (task.subTasks || []).filter(subTask => subTask.id !== id)
                }
              }
              return task
            })
          }
        }
        
        return { tasks: filteredTasks }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
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
      useToastStore.getState().addToast({
        message: "Görev başarıyla klonlandı",
        type: "success"
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      useToastStore.getState().addToast({
        message: errorMessage,
        type: "error"
      })
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

      // Başarı mesajı göster
      useToastStore.getState().addToast({
        message: "Görev başarıyla taşındı",
        type: "success"
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      useToastStore.getState().addToast({
        message: errorMessage,
        type: "error"
      })
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
          useToastStore.getState().addToast({
            message: "Önce alt görevleri tamamlayın",
            type: "warning"
          })
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
    
    // Eğer child task complete ediliyor ve parent varsa, parent durumunu kontrol et
    if (willBeCompleted && task.parentTaskId) {
      const siblings = state.tasks.filter(t => t.parentTaskId === task.parentTaskId)
      const allSiblingsCompleted = siblings.every(sibling => 
        sibling.id === id ? true : sibling.completed
      )
      
      // Tüm siblings complete ise parent'ı da complete et
      if (allSiblingsCompleted) {
        await state.updateTask(task.parentTaskId, { completed: true })
      }
    }
    
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
    
    // Show toast notification when task is completed
    if (willBeCompleted) {
      useToastStore.getState().addToast({
        message: "Görevi tamamladınız",
        action: {
          label: "Geri al",
          onClick: async () => {
            // Use get() again to access current state and updateTask method
            await get().updateTask(id, { completed: false })
            
            // Geri alma işleminde de parent task'ın subTasks array'ini güncelle
            const currentState = get()
            const taskToUndo = currentState.tasks.find(t => t.id === id)
            if (taskToUndo?.parentTaskId) {
              set(prevState => ({
                tasks: prevState.tasks.map(t => {
                  if (t.id === taskToUndo.parentTaskId) {
                    // Parent task'ın subTasks array'ini güncelle
                    const updatedSubTasks = t.subTasks?.map(subTask => 
                      subTask.id === id ? { ...subTask, completed: false } : subTask
                    ) || []
                    return { ...t, subTasks: updatedSubTasks }
                  }
                  return t
                })
              }))
            }
          }
        },
        duration: 6000 // 6 seconds to give time for undo
      })
    }
  },

  // Utility methods
  getTasksByProject: (projectId: string) => {
    const { tasks, showCompletedTasks } = get()
    const filteredTasks = tasks.filter(task => 
      task.projectId === projectId && 
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

  getTasksWithoutSection: (projectId: string) => {
    const { tasks, showCompletedTasks } = get()
    const filteredTasks = tasks.filter(task => 
      task.projectId === projectId &&
      task.sectionId === null && 
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
    try {
      const response = await fetch(`/api/tasks/${taskId}/pin`, {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle pin')
      }
      
      const updatedTask = await response.json()
      
      // Update task in store
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, isPinned: updatedTask.isPinned } : task
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
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

  updateTaskReminders: async (taskId: string, reminders: Array<{
    datetime: Date
    message?: string
    isActive?: boolean
  }>) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/tasks/${taskId}/reminders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminders }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task reminders')
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
  }
}))