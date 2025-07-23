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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tags.map((tag) => (
            <div 
              key={tag.id} 
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border border-gray-100/30 dark:border-gray-800/30 hover:border-gray-200/50 dark:hover:border-gray-700/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-gray-900/20 hover:-translate-y-1"
              onClick={() => router.push(`/tags/${tag.id}`)}
              style={{
                background: `linear-gradient(135deg, ${tag.color}08 0%, ${tag.color}02 100%)`
              }}
            >
              {/* Glow Effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${tag.color}15 0%, transparent 70%)`
                }}
              />
              
              {/* Animated Border */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(45deg, ${tag.color}20, transparent, ${tag.color}20)`,
                  padding: '1px',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude'
                }}
              />

              <div className="relative p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Icon with animated background */}
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${tag.color}20 0%, ${tag.color}40 100%)`,
                        boxShadow: `0 8px 32px ${tag.color}30`
                      }}
                    >
                      <PiTagSimpleFill
                        className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12"
                        style={{ color: tag.color }}
                      />
                    </div>
                    {/* Pulse animation */}
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 animate-pulse"
                      style={{ 
                        background: `radial-gradient(circle, ${tag.color}30 0%, transparent 70%)`
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {tag.name}
                    </h3>
                    <div 
                      className="px-4 py-2 rounded-full text-sm font-semibold border shadow-sm transition-all duration-300 group-hover:shadow-md"
                      style={{ 
                        backgroundColor: `${tag.color}15`,
                        borderColor: `${tag.color}30`,
                        color: tag.color
                      }}
                    >
                      {tag._count?.tasks || 0} görev
                    </div>
                  </div>
                </div>

                {/* Action buttons with glass effect */}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTag(tag.id)
                    }}
                    className="h-9 w-9 rounded-xl backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border border-white/20 hover:bg-white/90 dark:hover:bg-gray-700/90 shadow-lg hover:shadow-xl transition-all duration-200"
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
                    className="h-9 w-9 rounded-xl backdrop-blur-md bg-red-50/70 dark:bg-red-900/30 border border-red-200/50 hover:bg-red-100/90 dark:hover:bg-red-900/60 text-red-600 hover:text-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: tag.color }} />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full opacity-40 group-hover:opacity-80 transition-opacity" style={{ backgroundColor: tag.color }} />
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