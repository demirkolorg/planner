/**
 * Migration utility to gradually replace Zustand store with React Query
 * This hook provides backward compatibility while encouraging React Query usage
 */

"use client"

import { useProjects as useReactQueryProjects } from '@/hooks/queries/use-projects'
import { useProjectStore } from '@/store/projectStore'
import { useEffect } from 'react'

// Migration hook that prefers React Query but falls back to Zustand
export function useProjects() {
  // Try React Query first
  const reactQueryResult = useReactQueryProjects()
  
  // Fallback to Zustand (deprecated)
  const zustandProjects = useProjectStore((state) => state.projects)
  const zustandLoading = useProjectStore((state) => state.isLoading)
  const zustandError = useProjectStore((state) => state.error)
  const fetchProjectsZustand = useProjectStore((state) => state.fetchProjects)
  
  // Sync Zustand with React Query for backwards compatibility
  useEffect(() => {
    if (reactQueryResult.data && reactQueryResult.data !== zustandProjects) {
      // Update Zustand store with React Query data for components that still use it
      useProjectStore.setState({ 
        projects: reactQueryResult.data,
        isLoading: reactQueryResult.isLoading,
        error: reactQueryResult.error?.message || null
      })
    }
  }, [reactQueryResult.data, reactQueryResult.isLoading, reactQueryResult.error, zustandProjects])
  
  // Return React Query result with Zustand compatibility
  return {
    // React Query (preferred)
    data: reactQueryResult.data,
    isLoading: reactQueryResult.isLoading,
    error: reactQueryResult.error,
    refetch: reactQueryResult.refetch,
    
    // Zustand compatibility (deprecated)
    projects: reactQueryResult.data || zustandProjects,
    fetchProjects: fetchProjectsZustand, // Keep for backward compatibility
  }
}

// Optimized project selectors
export function useProjectById(projectId: string) {
  const projects = useProjects()
  return projects.data?.find(p => p.id === projectId)
}

// Legacy compatibility - returns projects array for backward compatibility
export function useProjectsArray() {
  const { data: projects } = useReactQueryProjects()
  return projects || []
}

// Performance-optimized hooks for specific use cases
export function useProjectsCount() {
  const { data: projects } = useReactQueryProjects()
  return projects?.length || 0
}

export function usePinnedProjects() {
  const { data: projects } = useReactQueryProjects()
  return projects?.filter(p => p.isPinned) || []
}

export function useProjectNames() {
  const { data: projects } = useReactQueryProjects()
  return projects?.map(p => ({ id: p.id, name: p.name, emoji: p.emoji })) || []
}

// Development helper
export function useMigrationStatus() {
  const reactQuery = useReactQueryProjects()
  const zustand = useProjectStore((state) => ({ 
    projects: state.projects, 
    isLoading: state.isLoading 
  }))
  
  return {
    reactQueryActive: Boolean(reactQuery.data),
    zustandActive: Boolean(zustand.projects.length),
    synchronized: reactQuery.data?.length === zustand.projects.length,
    recommendation: reactQuery.data ? 'Use React Query hooks' : 'Migration needed'
  }
}