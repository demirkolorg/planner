"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { CustomFieldModal } from "@/components/modals/custom-field-modal"
import { Plus, MoreVertical, Edit, Trash2, FileText } from "lucide-react"
import { CustomFieldsListProps, ProjectCustomField } from "@/types/custom-field"
import { useProjectCustomFieldStore } from "@/store/projectCustomFieldStore"
import { toast } from "sonner"

export function CustomFieldsList({ 
  projectId, 
  customFields, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: CustomFieldsListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ProjectCustomField | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<ProjectCustomField | null>(null)
  
  const { createCustomField, updateCustomField, deleteCustomField } = useProjectCustomFieldStore()

  const handleCreateField = async (key: string, value: string) => {
    try {
      await createCustomField(projectId, { key, value })
      toast.success("Özel alan başarıyla eklendi")
    } catch (error) {
      console.error('Create field error:', error)
      toast.error(error instanceof Error ? error.message : "Özel alan eklenirken hata oluştu")
      throw error
    }
  }

  const handleUpdateField = async (key: string, value: string) => {
    if (!editingField) return
    
    try {
      await updateCustomField(editingField.id, { key, value })
      toast.success("Özel alan başarıyla güncellendi")
    } catch (error) {
      console.error('Update field error:', error)
      toast.error(error instanceof Error ? error.message : "Özel alan güncellenirken hata oluştu")
      throw error
    }
  }

  const handleDeleteField = async () => {
    if (!fieldToDelete) return
    
    try {
      await deleteCustomField(fieldToDelete.id)
      setIsDeleteDialogOpen(false)
      setFieldToDelete(null)
      toast.success("Özel alan başarıyla silindi")
    } catch (error) {
      console.error('Delete field error:', error)
      toast.error(error instanceof Error ? error.message : "Özel alan silinirken hata oluştu")
    }
  }

  const handleEditClick = (field: ProjectCustomField) => {
    setEditingField(field)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (field: ProjectCustomField) => {
    setFieldToDelete(field)
    setIsDeleteDialogOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingField(null)
  }

  const existingKeys = customFields.map(field => field.key)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Özel Bilgiler</h3>
          <div className="w-24 h-8 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Özel Bilgiler</h3>
        <Button onClick={() => setIsModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Özel Alan Ekle
        </Button>
      </div>

      {/* Custom Fields Grid */}
      {customFields.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
          <div className="p-3 rounded-lg mx-auto mb-4 w-fit bg-muted/50">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h4 className="text-base font-medium mb-2">Bu projede henüz özel alan yok</h4>
          <p className="text-sm text-muted-foreground mb-4">
            İlk özel alanını ekleyerek projen hakkında detay bilgileri saklayabilirsin
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            İlk Özel Alanı Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields.map((field) => (
            <Card key={field.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 truncate">
                      {field.key}
                    </h4>
                    <div className="text-sm break-words">
                      {field.value.length > 100 ? (
                        <div>
                          <p className="line-clamp-3">{field.value}</p>
                          {field.value.length > 100 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {field.value.length} karakter
                            </p>
                          )}
                        </div>
                      ) : (
                        <p>{field.value}</p>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(field)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(field)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Custom Field Modal */}
      <CustomFieldModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={editingField ? handleUpdateField : handleCreateField}
        editingField={editingField}
        existingKeys={existingKeys}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setFieldToDelete(null)
        }}
        onConfirm={handleDeleteField}
        title="Özel Alanı Sil"
        message={`"${fieldToDelete?.key}" özel alanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  )
}