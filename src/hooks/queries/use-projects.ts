"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

// Project query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  sections: (projectId: string) => [...projectKeys.all, 'sections', projectId] as const,
}

// Fetch all projects
export function useProjects() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      return response.json()
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 dakika - projeler sık değişmez
  })
}

// Fetch project sections
export function useProjectSections(projectId: string) {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: projectKeys.sections(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/sections`)
      if (!response.ok) {
        throw new Error('Failed to fetch project sections')
      }
      return response.json()
    },
    enabled: isAuthenticated && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 dakika - sections sık değişmez
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
        throw new Error(error.error || 'Failed to create project')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
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
        throw new Error(error.error || 'Failed to update project')
      }
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) })
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
        throw new Error(error.error || 'Failed to delete project')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
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
        throw new Error(error.error || 'Failed to toggle project pin')
      }
      return response.json()
    },
    onMutate: async (projectId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.all })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(projectKeys.lists())

      // Optimistically update to the new value
      queryClient.setQueryData(projectKeys.lists(), (old: any) => {
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
        queryClient.setQueryData(projectKeys.lists(), context.previousProjects)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}