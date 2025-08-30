"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { QUERY_KEYS, invalidationStrategies } from '@/lib/query-keys'

// Fetch all projects
export function useProjects() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: QUERY_KEYS.projects.lists(),
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 saniye timeout
      
      try {
        const response = await fetch('/api/projects', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(ERROR_MESSAGES.AUTH_ERROR)
          }
          if (response.status >= 500) {
            throw new Error(ERROR_MESSAGES.SERVER_ERROR)
          }
          throw new Error(ERROR_MESSAGES.PROJECT.FETCH_FAILED)
        }
        return response.json()
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR)
        }
        throw error
      }
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika - projeler sık değişmez
    retry: 2, // 2 kez tekrar dene
    retryDelay: 1000, // 1 saniye bekle
  })
}

// Fetch project sections
export function useProjectSections(projectId: string) {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: QUERY_KEYS.projects.sections(projectId),
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 saniye timeout
      
      try {
        const response = await fetch(`/api/projects/${projectId}/sections`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(ERROR_MESSAGES.AUTH_ERROR)
          }
          if (response.status >= 500) {
            throw new Error(ERROR_MESSAGES.SERVER_ERROR)
          }
          throw new Error(ERROR_MESSAGES.SECTION.FETCH_FAILED)
        }
        return response.json()
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR)
        }
        throw error
      }
    },
    enabled: isAuthenticated && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 dakika - sections sık değişmez
    retry: 2, // 2 kez tekrar dene
    retryDelay: 1000, // 1 saniye bekle
  })
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectData: { name: string; emoji: string }) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      })
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.AUTH_ERROR)
        }
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.PERMISSION_ERROR)
        }
        throw new Error(error.error || ERROR_MESSAGES.PROJECT.CREATE_FAILED)
      }
      return response.json()
    },
    onSuccess: (newProject) => {
      // Optimize edilmiş invalidation strategy
      const keysToInvalidate = invalidationStrategies.onProjectChange()
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      
      // Optimistic update: yeni projeyi cache'e ekle
      queryClient.setQueryData(QUERY_KEYS.projects.lists(), (oldData: any) => {
        return oldData ? [...oldData, newProject] : [newProject]
      })
    },
  })
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.AUTH_ERROR)
        }
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.PERMISSION_ERROR)
        }
        throw new Error(error.error || ERROR_MESSAGES.PROJECT.UPDATE_FAILED)
      }
      return response.json()
    },
    onSuccess: (updatedProject, { id }) => {
      // Targeted invalidation
      const keysToInvalidate = invalidationStrategies.onProjectChange(id)
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      
      // Optimistic update: projeyi cache'de güncelle
      queryClient.setQueryData(QUERY_KEYS.projects.detail(id), updatedProject)
      queryClient.setQueryData(QUERY_KEYS.projects.lists(), (oldData: any) => {
        return oldData?.map((project: any) => 
          project.id === id ? { ...project, ...updatedProject } : project
        )
      })
    },
  })
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.AUTH_ERROR)
        }
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.PERMISSION_ERROR)
        }
        throw new Error(error.error || ERROR_MESSAGES.PROJECT.DELETE_FAILED)
      }
    },
    onSuccess: (_, deletedProjectId) => {
      // Project silindiğinde sadece gerekli cache'leri temizle
      const keysToInvalidate = invalidationStrategies.onProjectChange(deletedProjectId)
      keysToInvalidate.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      
      // Optimistic update: projeyi cache'den kaldır
      queryClient.setQueryData(QUERY_KEYS.projects.lists(), (oldData: any) => {
        return oldData?.filter((project: any) => project.id !== deletedProjectId)
      })
      
      // Detail cache'ini temizle
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projects.detail(deletedProjectId) })
    },
  })
}

// Toggle project pin mutation
export function useToggleProjectPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}/pin`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.AUTH_ERROR)
        }
        if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.PERMISSION_ERROR)
        }
        throw new Error(error.error || ERROR_MESSAGES.PROJECT.PIN_FAILED)
      }
      return response.json()
    },
    onMutate: async (projectId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.projects.lists() })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(QUERY_KEYS.projects.lists())

      // Optimistically update to the new value
      queryClient.setQueryData(QUERY_KEYS.projects.lists(), (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((project: any) => 
          project.id === projectId 
            ? { ...project, isPinned: !project.isPinned }
            : project
        )
      })

      // Return a context object with the snapshotted value
      return { previousProjects }
    },
    onError: (err, projectId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(QUERY_KEYS.projects.lists(), context.previousProjects)
      }
    },
    onSettled: (data, error, projectId) => {
      // Sadece gerektiğinde invalidate et
      if (error) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.lists() })
      } else {
        // Başarılı durumda sadece ilgili project detail'i güncelle
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.detail(projectId) })
      }
    },
  })
}