export interface ProjectCustomField {
  id: string
  projectId: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

export interface CreateCustomFieldData {
  key: string
  value: string
}

export interface UpdateCustomFieldData {
  key: string
  value: string
}

export interface CustomFieldModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, value: string) => Promise<void>
  editingField?: ProjectCustomField | null
  existingKeys?: string[]
}

export interface CustomFieldsListProps {
  projectId: string
  customFields: ProjectCustomField[]
  onEdit: (field: ProjectCustomField) => void
  onDelete: (fieldId: string) => void
  isLoading?: boolean
}

// Özel alan adı önerileri
export const CUSTOM_FIELD_SUGGESTIONS = [
  "İhale Tarihi",
  "Teslim Tarihi", 
  "Müteahhit Firma",
  "Proje Bütçesi",
  "Proje Lokasyonu",
  "Proje Müdürü",
  "Denetim Firması",
  "Yapı Ruhsatı No",
  "İnşaat Alanı",
  "Kat Sayısı",
  "Müşteri",
  "Sözleşme No",
  "Proje Tipi",
  "Durum",
  "Sorumlu Ekip"
] as const