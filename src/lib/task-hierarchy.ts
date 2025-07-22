// Hiyerarşik task yapısı oluşturma ve yönetme fonksiyonları

import type { Task, TaskWithHierarchy } from '@/types/task'

/**
 * Task listesini hiyerarşik yapıya dönüştürür
 * Parent-child ilişkilerini kurar ve level bilgisini ekler
 */
export function buildTaskHierarchy(tasks: Task[]): TaskWithHierarchy[] {
  // Task map oluştur - hızlı erişim için
  const taskMap = new Map<string, TaskWithHierarchy>()
  const rootTasks: TaskWithHierarchy[] = []
  
  // İlk aşama: tüm task'ları map'e ekle ve başlangıç değerlerini ata
  tasks.forEach(task => {
    const hierarchicalTask: TaskWithHierarchy = {
      ...task,
      level: 0,
      children: [],
      hasChildren: false,
      isExpanded: false,
      isLast: false
    }
    taskMap.set(task.id, hierarchicalTask)
  })
  
  // İkinci aşama: parent-child ilişkilerini kur ve level hesapla
  tasks.forEach(task => {
    const hierarchicalTask = taskMap.get(task.id)!
    
    if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
      // Alt görev ise parent'a ekle
      const parent = taskMap.get(task.parentTaskId)!
      hierarchicalTask.level = parent.level + 1
      parent.children!.push(hierarchicalTask)
      parent.hasChildren = true
    } else {
      // Kök görev ise root listesine ekle
      rootTasks.push(hierarchicalTask)
    }
  })
  
  // Her seviyede isLast bilgisini hesapla
  function markLastItems(taskList: TaskWithHierarchy[]) {
    taskList.forEach((task, index) => {
      task.isLast = index === taskList.length - 1
      if (task.children && task.children.length > 0) {
        markLastItems(task.children)
      }
    })
  }
  
  markLastItems(rootTasks)
  
  return rootTasks
}

/**
 * Hiyerarşik yapıdaki task'ı düz listeye dönüştürür (expand durumuna göre)
 * Sadece görünür task'ları döndürür
 */
export function flattenHierarchy(
  hierarchicalTasks: TaskWithHierarchy[],
  expandedTaskIds: Set<string> = new Set()
): TaskWithHierarchy[] {
  const flattened: TaskWithHierarchy[] = []
  
  function traverse(tasks: TaskWithHierarchy[]) {
    tasks.forEach(task => {
      flattened.push(task)
      
      // Eğer task expand edilmişse ve children varsa, onları da ekle
      if (expandedTaskIds.has(task.id) && task.children && task.children.length > 0) {
        traverse(task.children)
      }
    })
  }
  
  traverse(hierarchicalTasks)
  return flattened
}

/**
 * Belirli bir task'ın tüm parent'larını bulur
 */
export function getTaskParents(taskId: string, allTasks: Task[]): Task[] {
  const parents: Task[] = []
  const taskMap = new Map(allTasks.map(t => [t.id, t]))
  
  let currentTask = taskMap.get(taskId)
  
  while (currentTask?.parentTaskId) {
    const parent = taskMap.get(currentTask.parentTaskId)
    if (parent) {
      parents.unshift(parent) // En üstteki parent başa gelsin
      currentTask = parent
    } else {
      break
    }
  }
  
  return parents
}

/**
 * Belirli bir task'ın tüm children'larını recursive olarak bulur
 */
export function getAllChildrenIds(taskId: string, allTasks: Task[]): string[] {
  const children: string[] = []
  
  function findChildren(currentTaskId: string) {
    allTasks
      .filter(task => task.parentTaskId === currentTaskId)
      .forEach(child => {
        children.push(child.id)
        findChildren(child.id) // Recursive call
      })
  }
  
  findChildren(taskId)
  return children
}

/**
 * Task'ı yeni parent altına taşır ve level'ı yeniden hesaplar
 */
export function moveTaskToParent(
  taskId: string,
  newParentId: string | null,
  hierarchicalTasks: TaskWithHierarchy[]
): TaskWithHierarchy[] {
  // Deep copy oluştur
  const newTasks = JSON.parse(JSON.stringify(hierarchicalTasks)) as TaskWithHierarchy[]
  
  // Task'ı bul ve parent'ından çıkar
  function removeTaskFromCurrent(tasks: TaskWithHierarchy[]): TaskWithHierarchy | null {
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        return tasks.splice(i, 1)[0]
      }
      if (tasks[i].children) {
        const found = removeTaskFromCurrent(tasks[i].children!)
        if (found) return found
      }
    }
    return null
  }
  
  // Yeni parent'a ekle
  function addTaskToNewParent(tasks: TaskWithHierarchy[], task: TaskWithHierarchy): boolean {
    if (newParentId === null) {
      // Root level'e ekle
      task.level = 0
      tasks.push(task)
      return true
    }
    
    for (const t of tasks) {
      if (t.id === newParentId) {
        // Yeni parent bulundu
        task.level = t.level + 1
        if (!t.children) t.children = []
        t.children.push(task)
        t.hasChildren = true
        return true
      }
      if (t.children && addTaskToNewParent(t.children, task)) {
        return true
      }
    }
    return false
  }
  
  const taskToMove = removeTaskFromCurrent(newTasks)
  if (taskToMove) {
    // Children level'larını da güncelle
    function updateChildrenLevels(task: TaskWithHierarchy) {
      if (task.children) {
        task.children.forEach(child => {
          child.level = task.level + 1
          updateChildrenLevels(child)
        })
      }
    }
    
    addTaskToNewParent(newTasks, taskToMove)
    updateChildrenLevels(taskToMove)
  }
  
  return newTasks
}

/**
 * Task completion durumunu parent-child ilişkisine göre günceller
 */
export function updateCompletionState(
  taskId: string,
  completed: boolean,
  hierarchicalTasks: TaskWithHierarchy[]
): TaskWithHierarchy[] {
  const newTasks = JSON.parse(JSON.stringify(hierarchicalTasks)) as TaskWithHierarchy[]
  
  function updateTask(tasks: TaskWithHierarchy[]): boolean {
    for (const task of tasks) {
      if (task.id === taskId) {
        task.completed = completed
        
        // Eğer task complete ediliyor ve children varsa, onları da complete et
        if (completed && task.children) {
          function completeAllChildren(children: TaskWithHierarchy[]) {
            children.forEach(child => {
              child.completed = true
              if (child.children) {
                completeAllChildren(child.children)
              }
            })
          }
          completeAllChildren(task.children)
        }
        
        return true
      }
      
      if (task.children && updateTask(task.children)) {
        // Child bulundu, parent durumunu kontrol et
        if (completed && task.children.every(child => child.completed)) {
          // Tüm children complete ise parent'ı da complete et
          task.completed = true
        } else if (!completed) {
          // Child incomplete ise parent da incomplete olmalı
          task.completed = false
        }
        return true
      }
    }
    return false
  }
  
  updateTask(newTasks)
  return newTasks
}