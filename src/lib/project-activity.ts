import { db } from "@/lib/db"

// Proje aktivitesi türleri
export const ProjectActivityTypes = {
  // Proje işlemleri
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_DELETED: "project_deleted",
  
  // Bölüm işlemleri
  SECTION_CREATED: "section_created",
  SECTION_MOVED: "section_moved",
  SECTION_DELETED: "section_deleted",
  
  // Görev işlemleri (projeye ait)
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  TASK_UNCOMPLETED: "task_uncompleted",
  TASK_DELETED: "task_deleted",
  
  // Atama işlemleri
  USER_ASSIGNED: "user_assigned",
  EMAIL_ASSIGNED: "email_assigned",
  ASSIGNMENT_REMOVED: "assignment_removed"
} as const

export type ProjectActivityType = typeof ProjectActivityTypes[keyof typeof ProjectActivityTypes]

// Aktivite oluşturma fonksiyonu
export async function createProjectActivity(data: {
  projectId: string
  userId: string
  actionType: ProjectActivityType
  entityType: "project" | "section" | "task"
  entityId?: string | null
  entityName?: string | null
  oldValue?: string | null
  newValue?: string | null
  description: string
}) {
  try {
    const activity = await db.projectActivity.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        description: data.description
      }
    })
    return activity
  } catch (error) {
    console.error("Proje aktivitesi oluşturulurken hata:", error)
    return null
  }
}

// Aktivite açıklaması oluşturma helper'ları
export function getProjectActivityDescription(
  actionType: ProjectActivityType,
  entityName?: string | null,
  oldValue?: string | null,
  newValue?: string | null
): string {
  switch (actionType) {
    // Proje işlemleri
    case ProjectActivityTypes.PROJECT_CREATED:
      return "Proje oluşturuldu"
    case ProjectActivityTypes.PROJECT_UPDATED:
      if (oldValue && newValue) {
        return `Proje güncellendi: "${oldValue}" → "${newValue}"`
      }
      return "Proje güncellendi"
    case ProjectActivityTypes.PROJECT_DELETED:
      return "Proje silindi"
    
    // Bölüm işlemleri
    case ProjectActivityTypes.SECTION_CREATED:
      return `Bölüm oluşturuldu: "${entityName}"`
    case ProjectActivityTypes.SECTION_MOVED:
      return `Bölüm taşındı: "${entityName}"`
    case ProjectActivityTypes.SECTION_DELETED:
      return `Bölüm silindi: "${entityName}"`
    
    // Görev işlemleri
    case ProjectActivityTypes.TASK_CREATED:
      return `Görev oluşturuldu: "${entityName}"`
    case ProjectActivityTypes.TASK_COMPLETED:
      return `Görev tamamlandı: "${entityName}"`
    case ProjectActivityTypes.TASK_UNCOMPLETED:
      return `Görev tamamlanmamış olarak işaretlendi: "${entityName}"`
    case ProjectActivityTypes.TASK_DELETED:
      return `Görev silindi: "${entityName}"`
    
    // Atama işlemleri
    case ProjectActivityTypes.USER_ASSIGNED:
      return `${entityName} projeye ${newValue || 'VIEWER'} rolüyle atandı`
    case ProjectActivityTypes.EMAIL_ASSIGNED:
      return `${entityName} email ile projeye davet edildi`
    case ProjectActivityTypes.ASSIGNMENT_REMOVED:
      return `${entityName} projeden çıkarıldı`
    
    default:
      return "Bilinmeyen aktivite"
  }
}

// Aktivite türüne göre ikon belirleme
export function getProjectActivityIcon(actionType: ProjectActivityType): string {
  switch (actionType) {
    // Proje işlemleri
    case ProjectActivityTypes.PROJECT_CREATED:
      return "✨"
    case ProjectActivityTypes.PROJECT_UPDATED:
      return "✏️"
    case ProjectActivityTypes.PROJECT_DELETED:
      return "🗑️"
    
    // Bölüm işlemleri
    case ProjectActivityTypes.SECTION_CREATED:
      return "📁"
    case ProjectActivityTypes.SECTION_MOVED:
      return "📦"
    case ProjectActivityTypes.SECTION_DELETED:
      return "🗂️"
    
    // Görev işlemleri
    case ProjectActivityTypes.TASK_CREATED:
      return "➕"
    case ProjectActivityTypes.TASK_COMPLETED:
      return "✅"
    case ProjectActivityTypes.TASK_UNCOMPLETED:
      return "↩️"
    case ProjectActivityTypes.TASK_DELETED:
      return "🗑️"
    
    // Atama işlemleri
    case ProjectActivityTypes.USER_ASSIGNED:
      return "👤"
    case ProjectActivityTypes.EMAIL_ASSIGNED:
      return "📧"
    case ProjectActivityTypes.ASSIGNMENT_REMOVED:
      return "👋"
    
    default:
      return "📝"
  }
}

// Aktivite türüne göre renk belirleme
export function getProjectActivityColor(actionType: ProjectActivityType): string {
  switch (actionType) {
    // Proje işlemleri
    case ProjectActivityTypes.PROJECT_CREATED:
      return "text-green-600"
    case ProjectActivityTypes.PROJECT_UPDATED:
      return "text-blue-600"
    case ProjectActivityTypes.PROJECT_DELETED:
      return "text-red-600"
    
    // Bölüm işlemleri
    case ProjectActivityTypes.SECTION_CREATED:
      return "text-purple-600"
    case ProjectActivityTypes.SECTION_MOVED:
      return "text-orange-600"
    case ProjectActivityTypes.SECTION_DELETED:
      return "text-red-600"
    
    // Görev işlemleri
    case ProjectActivityTypes.TASK_CREATED:
      return "text-green-600"
    case ProjectActivityTypes.TASK_COMPLETED:
      return "text-emerald-600"
    case ProjectActivityTypes.TASK_UNCOMPLETED:
      return "text-yellow-600"
    case ProjectActivityTypes.TASK_DELETED:
      return "text-red-600"
    
    // Atama işlemleri
    case ProjectActivityTypes.USER_ASSIGNED:
      return "text-blue-600"
    case ProjectActivityTypes.EMAIL_ASSIGNED:
      return "text-indigo-600"
    case ProjectActivityTypes.ASSIGNMENT_REMOVED:
      return "text-orange-600"
    
    default:
      return "text-gray-600"
  }
}