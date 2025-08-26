import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 dakika - veriler 5 dakika boyunca fresh kabul edilir
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 dakika - veriler 10 dakika boyunca cache'de tutulur
      gcTime: 10 * 60 * 1000,
      // Background refetch: sayfa focus olduğunda otomatik yenile
      refetchOnWindowFocus: false,
      // Retry: hata durumunda 3 kez dene
      retry: (failureCount, error: any) => {
        // 401/403 hatalarında retry yapma
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Diğer hatalar için max 3 retry
        return failureCount < 3
      },
      // Retry delay: exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Mutation retry
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        return failureCount < 2
      },
    },
  },
})