"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, Edit, Trash2, MoreVertical, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useProjectStore } from "@/store/projectStore"
import { useProjectCustomFieldStore } from "@/store/projectCustomFieldStore"
import { CustomFieldModal } from "@/components/modals/custom-field-modal"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProjectCustomField } from "@/types/custom-field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SpecialFieldsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { projects } = useProjectStore()
  const { 
    fetchCustomFields, 
    getCustomFieldsByProject, 
    createCustomField, 
    updateCustomField, 
    deleteCustomField,
    isLoading,
    error 
  } = useProjectCustomFieldStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ProjectCustomField | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<ProjectCustomField | null>(null)

  const project = projects.find(p => p.id === projectId)
  const customFields = getCustomFieldsByProject(projectId)

  useEffect(() => {
    if (projectId) {
      fetchCustomFields(projectId)
    }
  }, [projectId, fetchCustomFields])

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

  if (isLoading && customFields.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-muted rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="rounded-lg border">
          <div className="h-12 border-b bg-muted/50 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Anasayfa stilinde */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Özel Alanlar
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              {project?.name && (
                <span className="font-semibold text-foreground">{project.name}</span>
              )} • {customFields.length} özel alan tanımlanmış
            </p>
          </div>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Yeni Özel Alan
        </Button>
      </div>

      {/* Table */}
      {customFields.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-muted rounded-lg">
          <div className="p-4 rounded-lg mx-auto mb-4 w-fit bg-muted/50">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Bu projede henüz özel alan yok</h3>
          <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
            İlk özel alanınızı ekleyerek projeniz hakkında detay bilgileri saklayabilirsiniz
          </p>
          <Button onClick={() => setIsModalOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            İlk Özel Alanı Ekle
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b text-base font-medium text-muted-foreground">
            <div className="col-span-3">Özel Alan Adı</div>
            <div className="col-span-7">Değeri</div>
            <div className="col-span-2 text-center">İşlemler</div>
          </div>
          
          {/* Table Rows */}
          <div className="divide-y">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                {/* Özel Alan Adı */}
                <div className="col-span-3 flex items-center">
                  <div className="text-base font-medium truncate">
                    {field.key}
                  </div>
                </div>
                
                {/* Değeri */}
                <div className="col-span-7 flex items-start py-1">
                  <div className="text-base break-words">
                    {field.value.length > 200 ? (
                      <div>
                        <p className="line-clamp-3">{field.value}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {field.value.length} karakter - Tam görünüm için düzenle
                        </p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{field.value}</p>
                    )}
                  </div>
                </div>
                
                {/* İşlemler */}
                <div className="col-span-2 flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
              </div>
            ))}
          </div>
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