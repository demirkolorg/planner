"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PiTagSimpleFill } from "react-icons/pi"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewTagModal } from "@/components/modals/new-tag-modal"
import { useTagStore } from "@/store/tagStore"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

export default function TagsPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<{id: string, name: string} | null>(null)
  const { tags, isLoading, error, fetchTags, createTag, updateTag, deleteTag, clearError } = useTagStore()

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleCreateTag = async (name: string, color: string) => {
    try {
      await createTag(name, color)
    } catch (error) {
      console.error("Failed to create tag:", error)
    }
  }

  const handleUpdateTag = async (id: string, name: string, color: string) => {
    try {
      await updateTag(id, name, color)
      setEditingTag(null)
    } catch (error) {
      console.error("Failed to update tag:", error)
    }
  }

  const handleDeleteTag = async (id: string, name: string) => {
    setTagToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTag = async () => {
    if (tagToDelete) {
      await deleteTag(tagToDelete.id)
      setTagToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PiTagSimpleFill className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-3xl font-bold">Etiketler</h1>
            <p className="text-muted-foreground">
              Görev etiketlerinizi yönetin
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Etiket
        </Button>
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearError}
            className="mt-2"
          >
            Kapat
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && tags.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <PiTagSimpleFill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Henüz etiket yok</h3>
          <p className="text-muted-foreground mb-4">İlk etiketinizi oluşturun</p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni Etiket
          </Button>
        </div>
      )}

      {!isLoading && tags.length > 0 && (
        <div className="space-y-4">
          {tags.map((tag) => (
            <div 
              key={tag.id} 
              className="group relative overflow-hidden rounded-lg border bg-card hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/tags/${tag.id}`)}
            >
              {/* <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: tag.color }}></div> */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: tag.color + '20' }}>
                      <PiTagSimpleFill
                        className="w-5 h-5"
                        style={{ color: tag.color }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{tag.name}</h3>
                      <div className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                        {tag._count?.tasks || 0} görev
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingTag(tag.id)
                      }}
                      className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTag(tag.id, tag.name)
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewTagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTag}
      />

      {editingTag && (
        <NewTagModal
          isOpen={true}
          onClose={() => setEditingTag(null)}
          onSave={(name, color) => handleUpdateTag(editingTag, name, color)}
          editingTag={tags.find(tag => tag.id === editingTag) || null}
        />
      )}

      {/* Silme Onay Dialog'u */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setTagToDelete(null)
        }}
        onConfirm={confirmDeleteTag}
        title="Etiketi Sil"
        message={`"${tagToDelete?.name}" etiketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve bu etiketle ilişkili tüm görevlerin etiket bağlantısı kaldırılacak.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  )
}