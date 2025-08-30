import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'

interface Project {
  id: string
  name: string
  emoji?: string
  notes?: string
  isPinned: boolean
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

interface Section {
  id: string
  name: string
  projectId: string
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

interface ProjectStore {
  // Legacy state - gradually migrating to React Query
  projects: Project[]
  sections: Section[]
  isLoading: boolean
  error: string | null
  lastFetchTime: number
  
  // Deprecated - use React Query hooks instead
  // @deprecated Use useProjects() from queries/use-projects
  fetchProjects: () => Promise<void>
  // @deprecated Use useCreateProject() from queries/use-projects
  createProject: (name: string, emoji: string) => Promise<Project>
  // @deprecated Use useUpdateProject() from queries/use-projects
  updateProject: (id: string, name: string, emoji: string) => Promise<void>
  // @deprecated Use useDeleteProject() from queries/use-projects
  deleteProject: (id: string) => Promise<void>
  // @deprecated Use useToggleProjectPin() from queries/use-projects
  toggleProjectPin: (id: string) => Promise<void>
  
  // Section Actions - still needed for local state management
  fetchSections: (projectId: string) => Promise<Section[]>
  createSection: (projectId: string, name: string) => Promise<void>
  updateSection: (id: string, name: string) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  moveSection: (sectionId: string, targetProjectId: string) => Promise<void>
  getSectionsByProject: (projectId: string) => Section[]
  
  // Utility functions - still needed
  incrementProjectTaskCount: (projectId: string) => void
  decrementProjectTaskCount: (projectId: string) => void
  clearError: () => void
}

export const useProjectStore = create<ProjectStore>()(  
  devtools(
    subscribeWithSelector((set, get) => ({
  projects: [],
  sections: [],
  isLoading: false,
  error: null,
  lastFetchTime: 0,

  fetchProjects: async () => {
    const state = get()
    const now = Date.now()
    
    // Throttle: Aynı API'yi 2 saniye içinde tekrar çağırma
    if (state.isLoading || (now - state.lastFetchTime) < 2000) {
      console.log('ProjectStore fetchProjects throttled - too soon or already loading')
      return
    }
    
    set({ isLoading: true, error: null, lastFetchTime: now })
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 saniye timeout - daha iyi UX için

      const response = await fetch('/api/projects', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const projects = await response.json()
      set({ projects, isLoading: false })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        set({ 
          error: 'Projeler yüklenirken zaman aşımı oluştu', 
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
      
      return newProject
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

  toggleProjectPin: async (id: string) => {
    set({ error: null })
    try {
      // Önce local state'i güncelle (optimistic update)
      const currentProject = get().projects.find(p => p.id === id)
      if (!currentProject) throw new Error('Project not found')
      
      const newPinState = !currentProject.isPinned
      set(state => ({
        projects: state.projects.map(project => 
          project.id === id ? { ...project, isPinned: newPinState } : project
        )
      }))
      
      // API çağrısını yap
      const response = await fetch(`/api/projects/${id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        // Hata durumunda eski state'i geri yükle
        set(state => ({
          projects: state.projects.map(project => 
            project.id === id ? { ...project, isPinned: !newPinState } : project
          )
        }))
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle pin')
      }
      
      // API'den gelen güncel projeyi al ve state'i güncelle
      const updatedProject = await response.json()
      set(state => ({
        projects: state.projects.map(project => 
          project.id === id ? { ...project, ...updatedProject.project } : project
        )
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' })
      throw error
    }
  },

  incrementProjectTaskCount: (projectId: string) => {
    set(state => ({
      projects: state.projects.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              _count: { 
                tasks: (project._count?.tasks || 0) + 1 
              } 
            }
          : project
      )
    }))
  },

  decrementProjectTaskCount: (projectId: string) => {
    set(state => ({
      projects: state.projects.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              _count: { 
                tasks: Math.max((project._count?.tasks || 0) - 1, 0) 
              } 
            }
          : project
      )
    }))
  },

  // Section Actions
  fetchSections: async (projectId: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${projectId}/sections`)
      if (!response.ok) {
        throw new Error('Failed to fetch sections')
      }
      const sections = await response.json()
      
      // Update sections in store (merge with existing sections from other projects)
      set(state => ({
        sections: [
          ...state.sections.filter(section => section.projectId !== projectId),
          ...sections
        ]
      }))
      
      return sections
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  createSection: async (projectId: string, name: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${projectId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create section')
      }
      
      const newSection = await response.json()
      set(state => ({
        sections: [...state.sections, newSection]
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  updateSection: async (id: string, name: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update section')
      }
      
      const updatedSection = await response.json()
      set(state => ({
        sections: state.sections.map(section => 
          section.id === id ? { ...section, ...updatedSection } : section
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteSection: async (id: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete section')
      }
      
      set(state => ({
        sections: state.sections.filter(section => section.id !== id)
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  moveSection: async (sectionId: string, targetProjectId: string) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/sections/${sectionId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetProjectId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to move section')
      }
      
      const updatedSection = await response.json()
      set(state => ({
        sections: state.sections.map(section => 
          section.id === sectionId ? { ...section, projectId: targetProjectId } : section
        )
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      set({ error: errorMessage })
      throw error
    }
  },

  getSectionsByProject: (projectId: string) => {
    return get().sections.filter(section => section.projectId === projectId)
  },

  clearError: () => set({ error: null })
    })),
    { name: 'project-store' }
  )
)

// Optimized selectors to prevent unnecessary re-renders
export const useProjectList = () => 
  useProjectStore((state) => state.projects, shallow)

export const useSectionsByProject = (projectId: string) => 
  useProjectStore(
    (state) => state.sections.filter(section => section.projectId === projectId),
    shallow
  )

export const useProjectLoading = () => 
  useProjectStore((state) => ({ isLoading: state.isLoading, error: state.error }))

export const useProjectError = () => 
  useProjectStore((state) => state.error)

// Utility selectors
export const useGetProjectById = (projectId: string) =>
  useProjectStore(
    (state) => state.projects.find(project => project.id === projectId),
    shallow
  )

export const useGetSectionById = (sectionId: string) =>
  useProjectStore(
    (state) => state.sections.find(section => section.id === sectionId),
    shallow
  )