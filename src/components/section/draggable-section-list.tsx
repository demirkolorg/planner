"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers"
import { SortableSectionItem } from "./sortable-section-item"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GripVertical, FolderOpen } from "lucide-react"

export interface Section {
  id: string
  name: string
  order: number
  projectId: string
  _count?: {
    tasks: number
  }
  createdAt: string
  updatedAt: string
}

interface DraggableSectionListProps {
  sections: Section[]
  onReorder: (sectionId: string, newOrder: number) => Promise<void>
  onSectionEdit?: (section: Section) => void
  onSectionDelete?: (section: Section) => void
  className?: string
  projectId?: string
}

export function DraggableSectionList({
  sections,
  onReorder,
  onSectionEdit,
  onSectionDelete,
  className,
  projectId,
}: DraggableSectionListProps) {
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [localSections, setLocalSections] = useState(sections)

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update local sections when props change
  useState(() => {
    setLocalSections(sections)
  })

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const section = localSections.find((s) => s.id === active.id)
    setActiveSection(section || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveSection(null)

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localSections.findIndex((item) => item.id === active.id)
    const newIndex = localSections.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedSections = arrayMove(localSections, oldIndex, newIndex)
      
      // Update local state immediately for smooth UX
      setLocalSections(reorderedSections)

      // Calculate new order based on position
      const newOrder = newIndex

      try {
        // Call API to update order
        await onReorder(active.id as string, newOrder)
      } catch (error) {
        // Revert on error
        console.error('Failed to reorder sections:', error)
        setLocalSections(sections) // Revert to original
      }
    }
  }

  if (localSections.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Henüz bölüm yok</h3>
        <p className="text-muted-foreground">
          İlk bölümünüzü oluşturarak başlayın
        </p>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <div className={className}>
        <SortableContext
          items={localSections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localSections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                onEdit={onSectionEdit}
                onDelete={onSectionDelete}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSection && (
            <Card className="p-4 shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-medium">{activeSection.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {activeSection._count?.tasks || 0} görev
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}