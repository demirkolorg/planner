import { QueryClient } from '@tanstack/react-query'

// Performance monitoring
const PERFORMANCE_LOG = process.env.NODE_ENV === 'development'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize edilmiş cache stratejisi
      staleTime: 3 * 60 * 1000, // 3 dakika - daha sık güncelleme
      gcTime: 15 * 60 * 1000, // 15 dakika - memory'de daha uzun tutma
      
      // Background refetch optimizasyonları
      refetchOnWindowFocus: true, // Aktif kullanım için enable
      refetchOnReconnect: true, // Network reconnect'te yenile
      refetchInterval: false, // Manual control için false
      
      // Performance optimizasyonu
      refetchOnMount: 'always', // Mount'ta her zaman fresh data
      
      // Error handling
      retry: (failureCount, error: any) => {
        // Auth hatalarında retry yapma
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Network hatalarında retry yap
        if (error?.name === 'AbortError') {
          return failureCount < 2
        }
        // Diğer hatalar için max 2 retry (daha hızlı feedback)
        return failureCount < 2
      },
      
      // Optimized retry delay
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Daha hızlı retry
    },
    mutations: {
      // Mutation retry optimizasyonu
      retry: (failureCount, error: any) => {
        // Auth hatalarında retry yapma
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Network timeout'larında 1 kez daha dene
        if (error?.name === 'AbortError') {
          return failureCount < 1
        }
        return failureCount < 1 // Mutation'lar için tek retry
      },
      
      // Hızlı retry delay
      retryDelay: 1000, // 1 saniye sabit delay
    },
  },
})

// Cache management utilities
export const cacheUtils = {
  // Selective invalidation
  invalidateProjects: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  },
  
  invalidateProject: (projectId: string) => {
    queryClient.invalidateQueries({ queryKey: ['projects', 'detail', projectId] })
    queryClient.invalidateQueries({ queryKey: ['projects', 'sections', projectId] })
  },
  
  invalidateTasks: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
  
  // Prefetch commonly used data
  prefetchProjects: () => {
    queryClient.prefetchQuery({
      queryKey: ['projects', 'list'],
      queryFn: async () => {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Failed to prefetch projects')
        return response.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  },
  
  // Clear cache strategically
  clearStaleCache: () => {
    queryClient.removeQueries({
      predicate: (query) => {
        return query.isStale() && !query.isFetching()
      }
    })
  },
  
  // Memory pressure handling
  handleMemoryPressure: () => {
    queryClient.clear() // Clear all cache
  }
}