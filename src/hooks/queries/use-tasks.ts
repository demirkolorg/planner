"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

// Task query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  assigned: (userId?: string) => [...taskKeys.all, 'assigned', userId] as const,
}

// Fetch all tasks
export function useTasks(taskType?: 'PROJECT' | 'CALENDAR' | 'QUICK_NOTE') {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: taskKeys.list({ taskType }),
    queryFn: async () => {
      const url = taskType ? `/api/tasks?taskType=${taskType}` : '/api/tasks'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      return response.json()
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 dakika - tasks sık değişebilir
  })
}

// Fetch assigned tasks
export function useAssignedTasks(completed?: boolean, projectId?: string) {
  const { isAuthenticated, user } = useAuthStore()

  return useQuery({
    queryKey: taskKeys.assigned(user?.id) + [{ completed, projectId }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (completed !== undefined) params.append('completed', String(completed))
      if (projectId) params.append('projectId', projectId)
      
      const response = await fetch(`/api/tasks/assigned?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assigned tasks')
      }
      return response.json()
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 dakika - assigned tasks sık kontrol edilir
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

// Toggle task complete mutation
export function useToggleTaskComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}