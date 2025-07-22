"use client"

import { cn } from "@/lib/utils"

interface TreeConnectorProps {
  level: number
  isLast: boolean
  hasChildren: boolean
  isExpanded: boolean
  className?: string
}

export function TreeConnector({
  level,
  isLast,
  hasChildren,
  isExpanded,
  className
}: TreeConnectorProps) {
  if (level === 0) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <div className="flex h-full">
        {/* Vertical lines for each level */}
        {Array.from({ length: level }).map((_, index) => {
          const isCurrentLevel = index === level - 1
          
          return (
            <div
              key={index}
              className={cn(
                "w-6 flex justify-center",
                index === 0 && "ml-2"  // İlk level için margin
              )}
            >
              {isCurrentLevel ? (
                // Current level - L shaped connector
                <div className="relative h-full w-px">
                  {/* Vertical line - only show if not last item */}
                  {!isLast && (
                    <div className="absolute inset-x-0 bottom-0 h-full border-l border-dashed border-muted-foreground/30" />
                  )}
                  
                  {/* Horizontal line and corner */}
                  <div className="absolute top-4 left-0 w-3 h-px border-t border-dashed border-muted-foreground/30" />
                  
                  {/* Vertical line to middle */}
                  <div 
                    className="absolute left-0 top-0 w-px border-l border-dashed border-muted-foreground/30"
                    style={{ height: '1rem' }}
                  />
                  
                  {/* Expansion indicator */}
                  {hasChildren && (
                    <div className="absolute top-3 -left-1 w-2 h-2 bg-background border border-muted-foreground/40 rounded-sm flex items-center justify-center">
                      <div 
                        className={cn(
                          "w-0.5 h-0.5 bg-muted-foreground/60 transition-transform duration-200",
                          isExpanded ? "rotate-90" : "rotate-0"
                        )}
                        style={{
                          transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)"
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Parent levels - just vertical line
                <div className="h-full w-px border-l border-dashed border-muted-foreground/30" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}