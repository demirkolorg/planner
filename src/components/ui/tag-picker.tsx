"use client"

import { useState, useEffect, useRef } from "react"
import { Tag, Search, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTagStore } from "@/store/tagStore"

interface TagPickerProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  trigger?: React.ReactNode
  className?: string
  dropdownPosition?: 'top' | 'bottom'
}

export function TagPicker({ selectedTags, onTagsChange, trigger, className, dropdownPosition = 'bottom' }: TagPickerProps) {
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [tagSearchInput, setTagSearchInput] = useState("")
  const { tags, fetchTags, createTag } = useTagStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTagPicker(false)
      }
    }

    if (showTagPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTagPicker])

  useEffect(() => {
    if (showTagPicker) {
      fetchTags()
    }
  }, [showTagPicker, fetchTags])

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag) 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    onTagsChange(newTags)
  }

  const handleCreateTag = async () => {
    if (tagSearchInput.trim() && !tags.find(tag => tag.name.toLowerCase() === tagSearchInput.trim().toLowerCase())) {
      const newTag = tagSearchInput.trim()
      try {
        // Create tag in backend and add to store
        await createTag(newTag, "#3b82f6") // Default blue color
        const newTags = [...selectedTags, newTag]
        onTagsChange(newTags)
        setTagSearchInput("")
      } catch (error) {
        console.error("Failed to create tag:", error)
      }
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag()
    }
  }

  const handleTagConfirm = () => {
    setShowTagPicker(false)
  }

  const handleTagClear = () => {
    onTagsChange([])
  }

  const getFilteredTags = () => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(tagSearchInput.toLowerCase())
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setShowTagPicker(!showTagPicker)}>
          {trigger}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowTagPicker(!showTagPicker)}
        >
          <Tag className="h-4 w-4" />
        </Button>
      )}

      {/* Tag Picker Dropdown */}
      {showTagPicker && (
        <div 
          className={`absolute right-0 w-72 bg-background border rounded-lg shadow-lg p-3 ${
            dropdownPosition === 'top' 
              ? 'bottom-full mb-1' 
              : 'top-full mt-1'
          }`}
          style={{ zIndex: 10000 }}
        >
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={tagSearchInput}
              onChange={(e) => setTagSearchInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Ara veya Oluştur"
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Tag List */}
          <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
            {getFilteredTags().map((tag) => (
              <div
                key={tag.id}
                className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => handleTagToggle(tag.name)}
              >
                <div className={`w-3 h-3 rounded border ${
                  selectedTags.includes(tag.name) 
                    ? 'bg-purple-600 border-purple-600' 
                    : 'border-gray-400'
                } flex items-center justify-center`}>
                  {selectedTags.includes(tag.name) && (
                    <Check className="h-2 w-2 text-white" />
                  )}
                </div>
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                ></div>
                <span className="text-xs">{tag.name}</span>
              </div>
            ))}

            {/* Create New Tag */}
            {tagSearchInput && !tags.some(tag => 
              tag.name.toLowerCase() === tagSearchInput.toLowerCase()
            ) && (
              <div
                className="flex items-center space-x-2 px-2 py-1 hover:bg-muted rounded-md cursor-pointer"
                onClick={handleCreateTag}
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs">Create '{tagSearchInput}'</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={handleTagClear}
              className="flex-1 h-7 text-xs"
              size="sm"
            >
              Temizle
            </Button>
            <Button
              onClick={handleTagConfirm}
              className="flex-1 h-7 text-xs"
              size="sm"
            >
              Tamamlandı
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}