import { create } from 'zustand'

interface Project {
  id: string
  name: string
  emoji?: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

interface ProjectStore {
  projects: Project[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (name: string, emoji: string) => Promise<void>
  updateProject: (id: string, name: string, emoji: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  clearError: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const projects = await response.json()
      set({ projects, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'An error occurred', 
        isLoading: false 
      })
    }
  },

  createProject: async (name: string, emoji: string) => {
    set({ error: null })
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, emoji }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }
      
      const newProject = await response.json()
      set(state => ({
        projects: [...state.projects, newProject]
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  updateProject: async (id: string, name: string, emoji: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, emoji }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project')
      }
      
      const updatedProject = await response.json()
      set(state => ({
        projects: state.projects.map(project => 
          project.id === id ? updatedProject : project
        )
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  deleteProject: async (id: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }
      
      set(state => ({
        projects: state.projects.filter(project => project.id !== id)
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))