"use client"

import React, { memo } from "react"
import { TagPicker } from "@/components/ui/tag-picker"

interface TaskTag {
  id: string
  taskId: string
  tagId: string
  tag: {
    id: string
    name: string
    color: string
  }
}

interface TagSelectorProps {
  taskTags?: TaskTag[]
  onUpdateTags?: (tagIds: string[]) => void
  trigger?: React.ReactNode
  dropdownPosition?: 'top' | 'bottom'
  disabled?: boolean
}

const TagSelector = memo(function TagSelector({ taskTags = [], onUpdateTags, trigger, dropdownPosition = 'top', disabled }: TagSelectorProps) {
  // Mevcut görevin tag isimlerini al
  const selectedTagNames = taskTags.map(taskTag => taskTag.tag.name)

  // TagPicker string array bekliyor, biz de string array veriyoruz
  const handleTagsChange = async (newTagNames: string[]) => {
    // Tag isimlerini ID'lere çevirmemiz gerekiyor
    try {
      // Önce tüm tag'ları al
      const response = await fetch('/api/tags')
      if (response.ok) {
        const allTags = await response.json()
        
        // Seçilen tag isimlerini ID'lere çevir
        const tagIds = newTagNames
          .map(name => allTags.find((tag: Tag) => tag.name === name)?.id)
          .filter(Boolean)
        
        onUpdateTags?.(tagIds)
      }
    } catch (error) {
      console.error('Failed to update tags:', error)
    }
  }

  return (
    <TagPicker
      selectedTags={selectedTagNames}
      onTagsChange={disabled ? undefined : handleTagsChange}
      trigger={trigger}
      dropdownPosition={dropdownPosition}
      disabled={disabled}
    />
  )
}, (prevProps, nextProps) => {
  // Sadece kritik prop değişikliklerinde re-render
  return (
    prevProps.taskTags?.length === nextProps.taskTags?.length &&
    prevProps.taskTags?.every((tag, index) => tag.id === nextProps.taskTags?.[index]?.id) &&
    prevProps.disabled === nextProps.disabled
  )
})

TagSelector.displayName = "TagSelector"

export { TagSelector }