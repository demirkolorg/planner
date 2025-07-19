import { create } from 'zustand'
import type { Task, CreateTaskRequest, CreateTaskResponse } from '@/types/task'
import { useToastStore } from './toastStore'

interface TaskWithRelations extends Omit<Task, 'createdAt' | 'updatedAt' | 'dueDate' | 'tags'> {
  createdAt: string
  updatedAt: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
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
  attachments?: Array<{
    id: string
    taskId: string
    fileName: string
    fileType: string
    fileUrl: string
    fileSize?: number
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
  uploadAttachment: (taskId: string, file: File) => Promise<void>
  deleteAttachment: (attachmentId: string) => Promise<void>
  
  // Utility methods
  getTasksByProject: (projectId: string) => TaskWithRelations[]
  getTasksByTag: (tagId: string) => TaskWithRelations[]
  getTasksBySection: (sectionId: string) => TaskWithRelations[]
  getPinnedTasks: () => TaskWithRelations[]
  getSubTasks: (parentTaskId: string) => TaskWithRelations[]
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
      console.log('🚀 Fetching tasks for project:', projectId)
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.log('❌ Error response:', errorData)
        throw new Error('Failed to fetch project tasks')
      }
      const tasks = await response.json()
      console.log('✅ Fetched tasks:', tasks.length)
      
      // Update store with new tasks (merge with existing tasks from other projects)
      set(state => ({
        tasks: [
          ...state.tasks.filter(task => task.projectId !== projectId),
          ...tasks
        ]
      }))
      
      return tasks
    } catch (error) {
      console.error('❌ TaskStore fetchTasksByProject error:', error)
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
    return tasks.filter(task => 
      task.projectId === projectId && 
      !task.parentTaskId && 
      (showCompletedTasks || !task.completed)
    )
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
    return tasks.filter(task => 
      task.sectionId === sectionId && 
      !task.parentTaskId &&
      (showCompletedTasks || !task.completed)
    )
  },

  getPinnedTasks: () => {
    const { tasks, showCompletedTasks } = get()
    return tasks.filter(task => 
      task.isPinned && 
      (showCompletedTasks || !task.completed)
    )
  },

  getSubTasks: (parentTaskId: string) => {
    return get().tasks.filter(task => task.parentTaskId === parentTaskId)
  },

  getCompletedTasksCount: (projectId: string) => {
    return get().tasks.filter(task => 
      task.projectId === projectId && 
      !task.parentTaskId && 
      task.completed
    ).length
  },

  getPendingTasksCount: (projectId: string) => {
    return get().tasks.filter(task => 
      task.projectId === projectId && 
      !task.parentTaskId && 
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

  uploadAttachment: async (taskId: string, file: File) => {
    set({ error: null })
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload attachment')
      }
      
      const newAttachment = await response.json()
      
      // Update task with new attachment
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                attachments: [...(task.attachments || []), newAttachment] 
              }
            : task
        )
      }))
      
      return newAttachment
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteAttachment: async (attachmentId: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete attachment')
      }
      
      // Remove attachment from all tasks
      set(state => ({
        tasks: state.tasks.map(task => ({
          ...task,
          attachments: task.attachments?.filter(att => att.id !== attachmentId) || []
        }))
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