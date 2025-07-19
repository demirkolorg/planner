"use client"

import { useState, useEffect } from "react"
import { Check, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Tag {
  id: string
  name: string
  color: string
}

interface TaskTag {
  id: string
  taskId: string
  tagId: string
  tag: Tag
}

interface TagSelectorProps {
  taskTags?: TaskTag[]
  onUpdateTags?: (tagIds: string[]) => void
  trigger?: React.ReactNode
}

export function TagSelector({ taskTags = [], onUpdateTags, trigger }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")

  const selectedTagIds = taskTags.map(taskTag => taskTag.tagId)

  // Tag renkleri
  const TAG_COLORS = [
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Yellow
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#6B7280", // Gray
    "#F97316", // Orange
  ]

  // Mevcut tag'ları yükle
  const fetchTags = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const tags = await response.json()
        setAvailableTags(tags)
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  // Tag seçimi/seçim iptali
  const toggleTag = (tagId: string) => {
    const newSelectedIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]
    
    onUpdateTags?.(newSelectedIds)
  }

  // Yeni tag oluştur
  const createNewTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setAvailableTags(prev => [...prev, newTag])
        
        // Yeni tag'ı otomatik olarak seç
        const newSelectedIds = [...selectedTagIds, newTag.id]
        onUpdateTags?.(newSelectedIds)
        
        // Form'u sıfırla
        setNewTagName("")
        setNewTagColor("#3B82F6")
        setIsCreatingTag(false)
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  // Arama filtresi
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Etiket Ekle
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-0" align="end">
        <div className="p-3">
          {/* Arama */}
          <Input
            placeholder="Etiket ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          {/* Seçili Etiketler */}
          {taskTags.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2">Seçili Etiketler</div>
              <div className="flex flex-wrap gap-1">
                {taskTags.map((taskTag) => (
                  <Badge
                    key={taskTag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: taskTag.tag.color + '20',
                      color: taskTag.tag.color,
                    }}
                  >
                    {taskTag.tag.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTag(taskTag.tagId)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Mevcut Etiketler */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
            ) : filteredTags.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'Etiket bulunamadı' : 'Henüz etiket yok'}
              </div>
            ) : (
              filteredTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </div>
                  {selectedTagIds.includes(tag.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </div>

          <DropdownMenuSeparator className="my-3" />

          {/* Yeni Etiket Oluştur */}
          {!isCreatingTag ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsCreatingTag(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Etiket Oluştur
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Etiket adı"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createNewTag()
                  } else if (e.key === 'Escape') {
                    setIsCreatingTag(false)
                    setNewTagName("")
                  }
                }}
              />
              <div className="flex gap-1 mb-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newTagColor === color ? 'border-gray-400' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={createNewTag} disabled={!newTagName.trim()}>
                  Oluştur
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingTag(false)
                    setNewTagName("")
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}