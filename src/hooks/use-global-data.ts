"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'

// Global data query keys
export const QUERY_KEYS = {
  projects: ['projects'] as const,
  tasks: ['tasks'] as const,
  tags: ['tags'] as const,
  googleAuthStatus: ['google-auth-status'] as const,
} as const

// Projects query
export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async () => {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 dakika cache
    cacheTime: 5 * 60 * 1000, // 5 dakika memory
  })
}

// Tasks query
export function useTasks() {
  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async () => {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 dakika cache (görevler daha dinamik)
    cacheTime: 3 * 60 * 1000, // 3 dakika memory
  })
}

// Tags query
export function useTags() {
  return useQuery({
    queryKey: QUERY_KEYS.tags,
    queryFn: async () => {
      const response = await fetch('/api/tags')
      if (!response.ok) throw new Error('Failed to fetch tags')
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 dakika cache (etiketler daha statik)
    cacheTime: 15 * 60 * 1000, // 15 dakika memory
  })
}

// Google Auth Status query
export function useGoogleAuthStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.googleAuthStatus,
    queryFn: async () => {
      const response = await fetch('/api/google/auth/status')
      if (!response.ok) throw new Error('Failed to fetch google auth status')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    cacheTime: 10 * 60 * 1000, // 10 dakika memory
  })
}

// Invalidation helper
export function useInvalidateGlobalData() {
  const queryClient = useQueryClient()
  
  return {
    invalidateProjects: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects }),
    invalidateTasks: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks }),
    invalidateTags: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags }),
    invalidateGoogleAuth: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.googleAuthStatus }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tags })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.googleAuthStatus })
    }
  }
}