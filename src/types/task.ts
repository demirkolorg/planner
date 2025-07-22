// Task ile ilgili TypeScript tip tanımları

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: Date
  isPinned: boolean
  parentTaskId?: string
  parentTask?: Task
  subTasks?: Task[]
  projectId: string
  project?: Project
  sectionId?: string
  section?: Section
  userId: string
  user?: User
  tags?: TaskTag[]
  reminders?: Reminder[]
  createdAt: Date
  updatedAt: Date
}

// Hiyerarşik task gösterimi için genişletilmiş tip
export interface TaskWithHierarchy extends Task {
  level: number
  children?: TaskWithHierarchy[]
  isExpanded?: boolean
  hasChildren?: boolean
  isLast?: boolean
}

export interface TaskTag {
  id: string
  taskId: string
  task?: Task
  tagId: string
  tag?: Tag
}

export interface Reminder {
  id: string
  taskId: string
  task?: Task
  datetime: Date
  message?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}


export interface Tag {
  id: string
  name: string
  color: string
  userId: string
  user?: User
  tasks?: TaskTag[]
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  emoji?: string
  notes?: string
  userId: string
  user?: User
  tasks?: Task[]
  sections?: Section[]
  createdAt: Date
  updatedAt: Date
}

export interface Section {
  id: string
  name: string
  projectId: string
  project?: Project
  tasks?: Task[]
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  projects?: Project[]
  tasks?: Task[]
  tags?: Tag[]
  createdAt: Date
  updatedAt: Date
}

// API Request/Response types
export interface CreateTaskRequest {
  title: string
  description?: string
  projectId: string
  sectionId: string
  priority?: string
  dueDate?: string  // ISO date string
  tags?: string[]   // Tag names
  reminders?: string[] // DateTime strings
  parentTaskId?: string // For sub-tasks
}

export interface CreateTaskResponse extends Task {
  project: Project
  section: Section
  tags: Array<TaskTag & { tag: Tag }>
  reminders: Reminder[]
}

// Priority mapping
export const PRIORITY_LABELS: Record<string, string> = {
  "HIGH": "Yüksek",
  "MEDIUM": "Orta", 
  "LOW": "Düşük",
  "NONE": "Yok"
}

export const PRIORITY_COLORS: Record<string, string> = {
  "HIGH": "#ef4444",    // red
  "MEDIUM": "#f97316",  // orange  
  "LOW": "#3b82f6",     // blue
  "NONE": "#9ca3af"     // gray
}

export const PRIORITY_EMOJIS: Record<string, string> = {
  "HIGH": "🔴",
  "MEDIUM": "🟠", 
  "LOW": "🔵",
  "NONE": "⚪️"
}