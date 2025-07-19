import { create } from 'zustand'
import type { Task, CreateTaskRequest, CreateTaskResponse } from '@/types/task'

interface TaskWithRelations extends Omit<Task, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: string
  updatedAt: string
  dueDate?: string
  tags?: Array<{
    id: string
    taskId: string
    tagId: string
    tag: {
      id: string
      name: string
      color: string
    }
  }>
  reminders?: Array<{
    id: string
    taskId: string
    datetime: Date
    message?: string
    isActive: boolean
  }>
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
  
  // Actions
  fetchTasks: () => Promise<void>
  fetchTasksByProject: (projectId: string) => Promise<TaskWithRelations[]>
  fetchTasksByTag: (tagId: string) => Promise<TaskWithRelations[]>
  createTask: (taskData: CreateTaskRequest) => Promise<CreateTaskResponse | null>
  updateTask: (id: string, updates: Partial<TaskWithRelations>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  
  // Utility methods
  getTasksByProject: (projectId: string) => TaskWithRelations[]
  getTasksByTag: (tagId: string) => TaskWithRelations[]
  getTasksBySection: (sectionId: string) => TaskWithRelations[]
  clearError: () => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

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
    
    await state.updateTask(id, { completed: !task.completed })
  },

  // Utility methods
  getTasksByProject: (projectId: string) => {
    return get().tasks.filter(task => task.projectId === projectId)
  },

  getTasksByTag: (tagId: string) => {
    return get().tasks.filter(task => 
      task.tags?.some(tagRel => tagRel.tagId === tagId)
    )
  },

  getTasksBySection: (sectionId: string) => {
    return get().tasks.filter(task => task.sectionId === sectionId)
  },

  clearError: () => set({ error: null })
}))