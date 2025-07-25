import { db } from "@/lib/db"

// Görev aktivitesi türleri
export const TaskActivityTypes = {
  CREATED: "created",
  UPDATED: "updated", 
  COMPLETED: "completed",
  UNCOMPLETED: "uncompleted",
  PRIORITY_CHANGED: "priority_changed",
  TAG_ADDED: "tag_added",
  TAG_REMOVED: "tag_removed", 
  DUE_DATE_CHANGED: "due_date_changed",
  PINNED: "pinned",
  UNPINNED: "unpinned",
  MOVED: "moved",
  DELETED: "deleted",
  SUBTASK_ADDED: "subtask_added",
  REMINDER_ADDED: "reminder_added",
  REMINDER_REMOVED: "reminder_removed",
  CLONED: "cloned",
  TITLE_CHANGED: "title_changed",
  DESCRIPTION_CHANGED: "description_changed"
} as const

export type TaskActivityType = typeof TaskActivityTypes[keyof typeof TaskActivityTypes]

// Aktivite oluşturma fonksiyonu
export async function createTaskActivity(data: {
  taskId: string
  userId: string
  actionType: TaskActivityType
  oldValue?: string | null
  newValue?: string | null
  description: string
}) {
  try {
    const activity = await db.taskActivity.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        actionType: data.actionType,
        oldValue: data.oldValue,
        newValue: data.newValue,
        description: data.description
      }
    })
    return activity
  } catch (error) {
    console.error("Aktivite oluşturulurken hata:", error)
    return null
  }
}

// Aktivite açıklaması oluşturma helper'ları
export function getActivityDescription(
  actionType: TaskActivityType,
  oldValue?: string | null,
  newValue?: string | null
): string {
  switch (actionType) {
    case TaskActivityTypes.CREATED:
      return "Görev oluşturuldu"
    case TaskActivityTypes.UPDATED:
      return "Görev güncellendi"
    case TaskActivityTypes.COMPLETED:
      return "Görev tamamlandı"
    case TaskActivityTypes.UNCOMPLETED:
      return "Görev tamamlanmadı olarak işaretlendi"
    case TaskActivityTypes.PRIORITY_CHANGED:
      return `Öncelik değiştirildi: ${oldValue} → ${newValue}`
    case TaskActivityTypes.TAG_ADDED:
      return `Etiket eklendi: ${newValue}`
    case TaskActivityTypes.TAG_REMOVED:
      return `Etiket kaldırıldı: ${oldValue}`
    case TaskActivityTypes.DUE_DATE_CHANGED:
      if (!oldValue && newValue) {
        return `Bitiş tarihi eklendi: ${newValue}`
      } else if (oldValue && !newValue) {
        return "Bitiş tarihi kaldırıldı"
      } else {
        return `Bitiş tarihi değiştirildi: ${oldValue} → ${newValue}`
      }
    case TaskActivityTypes.PINNED:
      return "Görev sabitlendi"
    case TaskActivityTypes.UNPINNED:
      return "Görev sabitleme kaldırıldı"
    case TaskActivityTypes.MOVED:
      return `Görev taşındı: ${oldValue} → ${newValue}`
    case TaskActivityTypes.DELETED:
      return "Görev silindi"
    case TaskActivityTypes.SUBTASK_ADDED:
      return `Alt görev eklendi: ${newValue}`
    case TaskActivityTypes.REMINDER_ADDED:
      return `Hatırlatıcı eklendi: ${newValue}`
    case TaskActivityTypes.REMINDER_REMOVED:
      return `Hatırlatıcı kaldırıldı: ${oldValue}`
    case TaskActivityTypes.CLONED:
      return "Görev klonlandı"
    case TaskActivityTypes.TITLE_CHANGED:
      return `Başlık değiştirildi: "${oldValue}" → "${newValue}"`
    case TaskActivityTypes.DESCRIPTION_CHANGED:
      if (!oldValue && newValue) {
        return "Açıklama eklendi"
      } else if (oldValue && !newValue) {
        return "Açıklama kaldırıldı"
      } else {
        return "Açıklama değiştirildi"
      }
    default:
      return "Bilinmeyen aktivite"
  }
}

// Öncelik değerlerini Türkçe'ye çeviren helper
export function getPriorityDisplayName(priority: string): string {
  switch (priority.toUpperCase()) {
    case "CRITICAL":
      return "Kritik"
    case "HIGH":
      return "Yüksek"
    case "MEDIUM":
      return "Orta"
    case "LOW":
      return "Düşük"
    case "NONE":
      return "Yok"
    default:
      return priority
  }
}