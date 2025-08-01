// Sistem projeleri - silinmemesi, düzenlenmemesi gereken projeler
export const PROTECTED_PROJECT_NAMES = [
  'Planner Takvimi',
  'Hızlı Notlar'
] as const

export type ProtectedProjectName = typeof PROTECTED_PROJECT_NAMES[number]

// Projenin korumalı olup olmadığını kontrol eder
export function isProtectedProject(projectName: string): boolean {
  return PROTECTED_PROJECT_NAMES.includes(projectName as ProtectedProjectName)
}

// Projenin sistem projesi olup olmadığını ID ile kontrol eder
export function isSystemProject(project: { name: string }): boolean {
  return isProtectedProject(project.name)
}

// Korumalı proje mesajları
export const PROTECTED_PROJECT_MESSAGES = {
  DELETE: 'Bu proje sistem tarafından oluşturulan özel bir projedir ve silinemez.',
  EDIT: 'Bu proje sistem tarafından oluşturulan özel bir projedir. Adı ve emojisi değiştirilemez, ancak açıklamasını düzenleyebilirsiniz.',
  COMPLETE: 'Sistem projeleri tamamlandı olarak işaretlenemez.'
} as const