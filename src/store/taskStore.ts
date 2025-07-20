import { create } from 'zustand'
import type { Task, CreateTaskRequest, CreateTaskResponse } from '@/types/task'
import { useToastStore } from './toastStore'

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
  getPinnedTasks: () => TaskWithRelations[]
  getSubTasks: (parentTaskId: string) => TaskWithRelations[]
  getTaskById: (taskId: string) => TaskWithRelations | undefined
  getCompletedTasksCount: (projectId: string) => number
  getPendingTasksCount: (projectId: string) => number
  toggleShowCompletedTasks: () => void
  clearError: () => void
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
      
      // Add new task to store
      set(state => ({
        tasks: [newTask, ...state.tasks]
      }))
      
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
      
      // Remove task from store
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id)
      }))
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
    
    await state.updateTask(id, { completed: willBeCompleted })
    
    // Show toast notification when task is completed
    if (willBeCompleted) {
      useToastStore.getState().addToast({
        message: "Görevi tamamladınız",
        action: {
          label: "Geri al",
          onClick: async () => {
            // Use get() again to access current state and updateTask method
            await get().updateTask(id, { completed: false })
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
    return tasks.filter(task => 
      task.tags?.some(tagRel => tagRel.tagId === tagId) && 
      !task.parentTaskId &&
      (showCompletedTasks || !task.completed)
    )
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

  clearError: () => set({ error: null })
}))