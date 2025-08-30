"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  GripVertical, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FolderOpen, 
  Target,
  Calendar,
  TrendingUp,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Section } from "./draggable-section-list"

interface SortableSectionItemProps {
  section: Section
  onEdit?: (section: Section) => void
  onDelete?: (section: Section) => void
}

export function SortableSectionItem({ section, onEdit, onDelete }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const taskCount = section._count?.tasks || 0
  
  // Sample completion rate calculation (would be calculated from actual task data)
  const completionRate = Math.floor(Math.random() * 100) // Placeholder

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50 shadow-xl z-50",
        "hover:shadow-md"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Section Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>

          {/* Section Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{section.name}</h4>
              <Badge variant="outline" className="text-xs">
                #{section.order + 1}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {taskCount} görev
              </span>

              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                %{completionRate} tamamlandı
              </span>

              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(section.updatedAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-medium">
                {taskCount > 0 ? 'Aktif' : 'Boş'}
              </div>
              <div className={cn(
                "text-xs",
                taskCount > 0 ? "text-green-600" : "text-muted-foreground"
              )}>
                {taskCount > 5 ? 'Yoğun' : taskCount > 0 ? 'Normal' : 'Bekliyor'}
              </div>
            </div>

            {/* Progress Ring */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted-foreground/20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(section)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bölümü Düzenle
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem>
                <Users className="h-4 w-4 mr-2" />
                Görevleri Görüntüle
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <TrendingUp className="h-4 w-4 mr-2" />
                Performans Analizi
              </DropdownMenuItem>

              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(section)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Bölümü Sil
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}