import { Loader2 } from "lucide-react"

export default function TaskDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            <div className="h-6 w-64 rounded bg-muted animate-pulse" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-8 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Center Panel Skeleton */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="h-6 w-6 bg-muted rounded-full animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="h-6 w-6 bg-muted rounded-full animate-pulse" />
                  <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}