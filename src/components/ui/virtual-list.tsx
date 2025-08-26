"use client"

import React, { useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  gap?: number
  overscan?: number
  getItemKey?: (item: T, index: number) => string | number
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  gap = 0,
  overscan = 5,
  getItemKey
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight + gap,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Memoize rendered items for performance
  const renderedItems = useMemo(() => {
    return virtualItems.map((virtualItem) => {
      const item = items[virtualItem.index]
      const key = getItemKey ? getItemKey(item, virtualItem.index) : virtualItem.index
      
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${itemHeight}px`,
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {renderItem(item, virtualItem.index)}
        </div>
      )
    })
  }, [virtualItems, items, itemHeight, renderItem, getItemKey])

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {renderedItems}
      </div>
    </div>
  )
}