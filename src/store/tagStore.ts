import { create } from "zustand"

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    tasks: number
  }
}

interface TagStore {
  tags: Tag[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchTags: () => Promise<void>
  createTag: (name: string, color: string) => Promise<void>
  updateTag: (id: string, name: string, color: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  clearError: () => void
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/tags")
      if (!response.ok) {
        throw new Error("Failed to fetch tags")
      }
      const tags = await response.json()
      set({ tags, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false 
      })
    }
  },

  createTag: async (name: string, color: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create tag")
      }
      
      const newTag = await response.json()
      set({ 
        tags: [newTag, ...get().tags], 
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false 
      })
      throw error
    }
  },

  updateTag: async (id: string, name: string, color: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update tag")
      }
      
      const updatedTag = await response.json()
      set({ 
        tags: get().tags.map(tag => 
          tag.id === id ? updatedTag : tag
        ), 
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false 
      })
      throw error
    }
  },

  deleteTag: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete tag")
      }
      
      set({ 
        tags: get().tags.filter(tag => tag.id !== id), 
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "An error occurred",
        isLoading: false 
      })
      throw error
    }
  },

  clearError: () => set({ error: null })
}))