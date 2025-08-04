import { create } from 'zustand'
import { ProjectCustomField, CreateCustomFieldData, UpdateCustomFieldData } from '@/types/custom-field'

interface ProjectCustomFieldStore {
  customFields: ProjectCustomField[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchCustomFields: (projectId: string) => Promise<void>
  createCustomField: (projectId: string, data: CreateCustomFieldData) => Promise<ProjectCustomField>
  updateCustomField: (fieldId: string, data: UpdateCustomFieldData) => Promise<ProjectCustomField>
  deleteCustomField: (fieldId: string) => Promise<void>
  getCustomFieldsByProject: (projectId: string) => ProjectCustomField[]
  clearError: () => void
}

export const useProjectCustomFieldStore = create<ProjectCustomFieldStore>((set, get) => ({
  customFields: [],
  isLoading: false,
  error: null,

  fetchCustomFields: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/projects/${projectId}/custom-fields`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch custom fields')
      }
      
      const customFields = await response.json()
      
      set((state) => ({
        customFields: [
          ...state.customFields.filter(field => field.projectId !== projectId),
          ...customFields
        ],
        isLoading: false
      }))
    } catch (error) {
      console.error('Error fetching custom fields:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch custom fields',
        isLoading: false 
      })
    }
  },

  createCustomField: async (projectId: string, data: CreateCustomFieldData) => {
    set({ error: null })
    try {
      const response = await fetch(`/api/projects/${projectId}/custom-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create custom field')
      }
      
      const newCustomField = await response.json()
      
      set((state) => ({
        customFields: [...state.customFields, newCustomField]
      }))
      
      return newCustomField
    } catch (error) {
      console.error('Error creating custom field:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create custom field'
      set({ error: errorMessage })
      throw error
    }
  },

  updateCustomField: async (fieldId: string, data: UpdateCustomFieldData) => {
    set({ error: null })
    try {
      // fieldId'den projectId'yi bul
      const existingField = get().customFields.find(field => field.id === fieldId)
      if (!existingField) {
        throw new Error('Custom field not found')
      }

      const response = await fetch(`/api/projects/${existingField.projectId}/custom-fields/${fieldId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update custom field')
      }
      
      const updatedCustomField = await response.json()
      
      set((state) => ({
        customFields: state.customFields.map(field =>
          field.id === fieldId ? updatedCustomField : field
        )
      }))
      
      return updatedCustomField
    } catch (error) {
      console.error('Error updating custom field:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update custom field'
      set({ error: errorMessage })
      throw error
    }
  },

  deleteCustomField: async (fieldId: string) => {
    set({ error: null })
    try {
      // fieldId'den projectId'yi bul
      const existingField = get().customFields.find(field => field.id === fieldId)
      if (!existingField) {
        throw new Error('Custom field not found')
      }

      const response = await fetch(`/api/projects/${existingField.projectId}/custom-fields/${fieldId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete custom field')
      }
      
      set((state) => ({
        customFields: state.customFields.filter(field => field.id !== fieldId)
      }))
    } catch (error) {
      console.error('Error deleting custom field:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom field'
      set({ error: errorMessage })
      throw error
    }
  },

  getCustomFieldsByProject: (projectId: string) => {
    return get().customFields.filter(field => field.projectId === projectId)
  },

  clearError: () => {
    set({ error: null })
  }
}))