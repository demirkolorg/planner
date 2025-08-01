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
        {/* Generate connectors for each level (from 0 to level-1) */}
        {Array.from({ length: level }).map((_, index) => {
          const isCurrentLevel = index === level - 1
          const currentLevelValue = index + 1 // Level 1, 2, 3, etc.
          const leftPosition = currentLevelValue * 48 - 24 // Recalculate position
          
          return (
            <div key={index} className="absolute h-full" style={{ left: `${leftPosition}px` }}>
              {/* Parent levels - always show vertical line */}
              {!isCurrentLevel && (
                <div 
                  className="absolute w-px h-full border-l border-dashed border-muted-foreground/30"
                  style={{ left: '0px' }}
                />
              )}
              
              {/* Current level connector */}
              {isCurrentLevel && (
                <div className="relative h-full">
                  {/* Vertical line from top to center */}
                  <div 
                    className="absolute w-px border-l border-dashed border-muted-foreground/30"
                    style={{ 
                      left: '0px',
                      top: '0px',
                      height: '18px' // Görev kartının yarısına kadar
                    }}
                  />
                  
                  {/* Horizontal line to task */}
                  <div 
                    className="absolute h-px border-t border-dashed border-muted-foreground/30"
                    style={{ 
                      left: '0px',
                      top: '18px',
                      width: '24px' // Task'a kadar uzanır
                    }}
                  />
                  
                  {/* Vertical line from center to bottom (if not last) */}
                  {!isLast && (
                    <div 
                      className="absolute w-px border-l border-dashed border-muted-foreground/30"
                      style={{ 
                        left: '0px',
                        top: '18px',
                        height: 'calc(100% - 18px)'
                      }}
                    />
                  )}
                  
                  {/* Expansion indicator */}
                  {hasChildren && (
                    <div 
                      className="absolute w-3 h-3 bg-background border border-muted-foreground/40 rounded-sm flex items-center justify-center"
                      style={{
                        left: '-6px',
                        top: '12px'
                      }}
                    >
                      <div 
                        className={cn(
                          "w-1 h-1 bg-muted-foreground/60 transition-transform duration-200",
                          isExpanded ? "rotate-45" : "rotate-0"
                        )}
                        style={{
                          clipPath: isExpanded ? 'polygon(0 0, 100% 50%, 0 100%)' : 'polygon(50% 0, 100% 100%, 0 100%)'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}