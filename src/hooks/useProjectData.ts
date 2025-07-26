import { useQuery } from '@tanstack/react-query'

interface Project {
  id: string
  name: string
  emoji?: string
  notes?: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface Section {
  id: string
  name: string
  projectId: string
  order: number
  createdAt: string
  updatedAt: string
}

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: string
  dueDate?: string
  isPinned: boolean
  parentTaskId?: string
  projectId: string
  sectionId?: string
  userId: string
  createdAt: string
  updatedAt: string
  tags?: Array<{
    id: string
    taskId: string
    tagId: string
    tag: {
      id: string
      name: string
      color: string
    }
  }>
  reminders?: Array<{
    id: string
    taskId: string
    datetime: Date
    message?: string
    isActive: boolean
  }>
  project?: {
    id: string
    name: string
    emoji?: string
  }
  section?: {
    id: string
    name: string
  }
  _count?: {
    comments: number
  }
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Proje bulunamadı')
      }
      return response.json()
    },
    enabled: !!projectId,
  })
}

export function useProjectSections(projectId: string) {
  return useQuery({
    queryKey: ['project-sections', projectId],
    queryFn: async (): Promise<Section[]> => {
      const response = await fetch(`/api/projects/${projectId}/sections`)
      if (!response.ok) {
        throw new Error('Bölümler alınamadı')
      }
      return response.json()
    },
    enabled: !!projectId,
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch(`/api/projects/${projectId}/tasks`)
      if (!response.ok) {
        throw new Error('Görevler alınamadı')
      }
      return response.json()
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 dakika - tasks daha sık değişebilir
  })
}