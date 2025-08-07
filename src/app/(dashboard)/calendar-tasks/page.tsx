"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle2, Timer, AlertTriangle } from "lucide-react"
import { useTaskStore } from "@/store/taskStore"
import { useProjectStore } from "@/store/projectStore"
import { useTagStore } from "@/store/tagStore"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/task/task-card"
import { MoveTaskModal } from "@/components/modals/move-task-modal"
import { TaskCommentsModal } from "@/components/modals/task-comments-modal"
import { TaskDeleteDialog } from "@/components/ui/task-delete-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ViewMode = 'week' | 'month'

export default function CalendarTasksPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  
  // Modal states
  const [isTaskDeleteDialogOpen, setIsTaskDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string; subTaskCount: number } | null>(null)
  const [isTaskMoveModalOpen, setIsTaskMoveModalOpen] = useState(false)
  const [taskToMove, setTaskToMove] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isTaskCloneModalOpen, setIsTaskCloneModalOpen] = useState(false)
  const [taskToClone, setTaskToClone] = useState<{ id: string; title: string; projectId: string; sectionId?: string } | null>(null)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [commentsModalTask, setCommentsModalTask] = useState<{ id: string; title: string; completed: boolean } | null>(null)

  const { 
    getCalendarTasks,
    fetchTasks, 
    toggleTaskComplete, 
    updateTask, 
    deleteTask: deleteTaskFromStore, 
    toggleTaskPin,
    updateTaskTags,
    cloneTask,
    moveTask,
    refreshTaskCommentCount,
  } = useTaskStore()

  const { fetchProjects } = useProjectStore()
  const { fetchTags } = useTagStore()

  const calendarTasks = getCalendarTasks()

  // Tarih formatlama fonksiyonları
  const formatToTurkishDate = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${dayName}, ${day} ${monthName} ${year}`
  }

  const formatMonthYear = (date: Date) => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }

  // Tarihe göre görevleri grupla
  const getTasksForDate = (date: Date) => {
    const dateStr = date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0')
    
    return calendarTasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      const taskDateStr = taskDate.getFullYear() + '-' + 
                         String(taskDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(taskDate.getDate()).padStart(2, '0')
      return taskDateStr === dateStr
    })
  }

  // Haftalık görünüm için haftanın günlerini al
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Pazartesi başlangıç
    startOfWeek.setDate(diff)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Aylık görünüm için ayın günlerini al
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    const startDay = firstDay.getDay()
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1
    startDate.setDate(firstDay.getDate() - daysToSubtract)
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  // Navigasyon fonksiyonları
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      newDate.setMonth(currentDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isTodayInCurrentView = () => {
    const today = new Date()
    
    if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate)
      return weekDays.some(day => isToday(day))
    } else {
      return today.getMonth() === currentDate.getMonth() && 
             today.getFullYear() === currentDate.getFullYear()
    }
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // İstatistikler
  const weekDays = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)
  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

  // Haftalık istatistikler
  const weekTasks = viewMode === 'week' ? 
    weekDays.flatMap(day => getTasksForDate(day)) : []
  const weekCompletedTasks = weekTasks.filter(task => task.completed)
  const weekPendingTasks = weekTasks.filter(task => !task.completed)

  // Hafta numarası hesaplama
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  // Handler functions
  const handleCommentTask = useCallback((taskId: string, taskTitle: string) => {
    const task = calendarTasks.find(t => t.id === taskId)
    setCommentsModalTask({ id: taskId, title: taskTitle, completed: task?.completed || false })
    setIsCommentsModalOpen(true)
  }, [calendarTasks])

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = calendarTasks.find(t => t.id === taskId)
    if (task) {
      const subTaskCount = task.subTasks?.length || 0
      setTaskToDelete({ id: taskId, title: task.title, subTaskCount })
      setIsTaskDeleteDialogOpen(true)
    }
  }, [calendarTasks])

  const handleCloneTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      setIsTaskCloneModalOpen(false)
      setTaskToClone(null)
      
      const [cloneResult] = await Promise.allSettled([
        cloneTask(taskId, targetProjectId, targetSectionId)
      ])
      
      if (cloneResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Clone failed:', cloneResult.reason)
      }
    } catch (error) {
      console.error('Failed to clone task:', error)
    }
  }, [cloneTask, fetchTasks])

  const handleMoveTask = useCallback(async (taskId: string, targetProjectId: string, targetSectionId?: string) => {
    try {
      setIsTaskMoveModalOpen(false)
      setTaskToMove(null)
      
      const [moveResult] = await Promise.allSettled([
        moveTask(taskId, targetProjectId, targetSectionId)
      ])
      
      if (moveResult.status === 'fulfilled') {
        await fetchTasks()
      } else {
        console.error('Move failed:', moveResult.reason)
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }, [moveTask, fetchTasks])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskToCopy = calendarTasks.find(t => t.id === taskId)
    if (taskToCopy) {
      setTaskToClone({
        id: taskId,
        title: taskToCopy.title,
        projectId: taskToCopy.projectId || '',
        sectionId: undefined
      })
      setIsTaskCloneModalOpen(true)
    }
  }, [calendarTasks])

  const handleMoveTaskModal = useCallback((taskId: string) => {
    const taskToMoveItem = calendarTasks.find(t => t.id === taskId)
    if (taskToMoveItem) {
      setTaskToMove({
        id: taskId,
        title: taskToMoveItem.title,
        projectId: taskToMoveItem.projectId || '',
        sectionId: undefined
      })
      setIsTaskMoveModalOpen(true)
    }
  }, [calendarTasks])

  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetchProjects(),
      fetchTags()
    ]).catch(error => {
      console.error('Failed to fetch calendar tasks data:', error)
    })
  }, [fetchTasks, fetchProjects, fetchTags])

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header with View Modes - Fixed */}
        <div className="space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <CalendarDays className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Google Takvim
                </h1>
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {viewMode === 'week' ? formatToTurkishDate(currentDate) : formatMonthYear(currentDate)}
                  </p>
                  {viewMode === 'week' && (
                    <p className="text-xs text-muted-foreground">
                      {currentDate.getFullYear()} yılının {getWeekNumber(currentDate)}. haftası
                    </p>
                  )}
                  {viewMode === 'month' && (
                    <p className="text-xs text-muted-foreground">
                      {currentDate.getFullYear()} yılının {currentDate.getMonth() + 1}. ayı
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mini Stats - Centered */}
            {viewMode === 'week' && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{weekPendingTasks.length}</div>
                  <div className="text-xs text-muted-foreground">yapılacak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{weekCompletedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">tamamlandı</div>
                </div>
              </div>
            )}

            {/* Navigation and View Mode */}
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={isTodayInCurrentView() ? "default" : "secondary"}
                  size="sm"
                  onClick={goToToday}
                  className="px-4"
                >
                  Bugün
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Mode Navigation */}
              <div className="flex items-center space-x-1 bg-muted/50 border border-border rounded-xl p-1">
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="h-8 px-3 rounded-lg"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Hafta
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-8 px-3 rounded-lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Ay
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Only for Week View */}
        {viewMode === 'week' && weekTasks.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 rounded-xl p-4 mt-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Haftalık İlerleme</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((weekCompletedTasks.length / weekTasks.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${weekTasks.length > 0 ? (weekCompletedTasks.length / weekTasks.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto mt-6 scrollbar-thin-hover">
          {calendarTasks.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-muted rounded-lg">
              <div className="p-4 rounded-lg mx-auto mb-4 w-fit bg-muted/50">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Henüz Google Takvim görevi yok
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Google Calendar entegrasyonunu etkinleştirin ve Google Takvim etkinlikleriniz otomatik olarak buraya aktarılsın
              </p>
            </div>
          ) : viewMode === 'week' ? (
            /* Haftalık Görünüm - Yatay Satırlar */
            <div className="space-y-6 pb-6 pr-2">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDate(day)
                
                return (
                  <div key={day.toISOString()} className="space-y-3">
                    {/* Gün Başlığı */}
                    <div className={`p-4 rounded-xl border transition-all duration-200 ${
                      isToday(day) 
                        ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-card border-border hover:border-border/80'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isToday(day) 
                              ? 'bg-gradient-to-br from-blue-400 to-cyan-500' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-white font-bold text-lg">{day.getDate()}</span>
                          </div>
                          <div>
                            <h3 className={`text-lg font-semibold ${
                              isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                            }`}>
                              {dayNames[index]}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {day.getDate()} {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][day.getMonth()]} {day.getFullYear()}
                              {isToday(day) && (
                                <span className="text-blue-500 dark:text-blue-400 font-medium ml-2">• Bugün</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-foreground">{dayTasks.length}</div>
                            <div className="text-xs text-muted-foreground">toplam</div>
                          </div>
                          {dayTasks.length > 0 && (
                            <>
                              <div className="w-px h-8 bg-border" />
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-600">
                                  {dayTasks.filter(t => t.completed).length}
                                </div>
                                <div className="text-xs text-muted-foreground">tamamlandı</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Görevler */}
                    {dayTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-muted/10 rounded-lg">
                        <span className="text-2xl mb-2 block">📅</span>
                        <p className="text-sm">Bu gün için Google Takvim görevi yok</p>
                      </div>
                    ) : (
                      <div className="space-y-2 pl-6">
                        {dayTasks.map((task) => (
                          <TaskCard 
                            key={task.id}
                            task={task}
                            onToggleComplete={toggleTaskComplete}
                            onUpdate={updateTask}
                            onDelete={handleDeleteTask}
                            onPin={toggleTaskPin}
                            onUpdateTags={updateTaskTags}
                            onEdit={() => {}}
                            onCopy={handleCopyTask}
                            onMove={handleMoveTaskModal}
                            onComment={handleCommentTask}
                            className="hover:shadow-sm transition-shadow"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Aylık Görünüm - Grid */
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header - Gün isimleri */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((dayName) => (
                  <div key={dayName} className="p-4 text-center text-sm font-medium text-muted-foreground">
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  const dayTasks = getTasksForDate(day)
                  const completedTasks = dayTasks.filter(task => task.completed)
                  const pendingTasks = dayTasks.filter(task => !task.completed)
                  
                  const today = new Date()
                  const dayMidnight = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  const overdueTasks = dayTasks.filter(task => 
                    !task.completed && dayMidnight < todayMidnight
                  )
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[120px] p-2 border-r border-b border-border last-in-row:border-r-0 ${
                        !isCurrentMonth(day) ? 'bg-muted/20 text-muted-foreground' : ''
                      } ${
                        isToday(day) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      } ${
                        index >= 35 ? 'border-b-0' : ''
                      }`}
                    >
                      {/* Gün başlığı */}
                      <div className={`text-sm font-medium mb-2 ${
                        isToday(day) ? 'text-blue-600 dark:text-blue-400' : ''
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      {/* Görev İstatistikleri */}
                      <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                        {dayTasks.length === 0 ? (
                          <div className="text-xs text-muted-foreground/50">
                            Görev yok
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {/* Gecikmiş görevler */}
                            {overdueTasks.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center space-x-1 cursor-pointer">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                      {overdueTasks.length}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Gecikmiş görevler</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Bekleyen görevler */}
                            {(pendingTasks.length - overdueTasks.length) > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center space-x-1 cursor-pointer">
                                    <Timer className="w-3 h-3 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                                      {pendingTasks.length - overdueTasks.length}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Bekleyen görevler</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {/* Tamamlanan görevler */}
                            {completedTasks.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center space-x-1 cursor-pointer">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                      {completedTasks.length}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tamamlanan görevler</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <TaskDeleteDialog
          isOpen={isTaskDeleteDialogOpen}
          onClose={() => {
            setIsTaskDeleteDialogOpen(false)
            setTaskToDelete(null)
          }}
          onConfirm={async () => {
            if (taskToDelete) {
              try {
                await deleteTaskFromStore(taskToDelete.id)
                await fetchTasks()
                setIsTaskDeleteDialogOpen(false)
                setTaskToDelete(null)
              } catch (error) {
                console.error('Failed to delete task:', error)
              }
            }
          }}
          task={taskToDelete}
        />

        <MoveTaskModal
          isOpen={isTaskCloneModalOpen}
          onClose={() => {
            setIsTaskCloneModalOpen(false)
            setTaskToClone(null)
          }}
          onMove={handleCloneTask}
          task={taskToClone}
          mode="clone"
        />

        <MoveTaskModal
          isOpen={isTaskMoveModalOpen}
          onClose={() => {
            setIsTaskMoveModalOpen(false)
            setTaskToMove(null)
          }}
          onMove={handleMoveTask}
          task={taskToMove}
        />

        <TaskCommentsModal
          isOpen={isCommentsModalOpen}
          onClose={() => {
            setIsCommentsModalOpen(false)
            setCommentsModalTask(null)
          }}
          taskId={commentsModalTask?.id || ''}
          taskTitle={commentsModalTask?.title || ''}
          isTaskCompleted={commentsModalTask?.completed || false}
          onCommentAdded={() => {
            if (commentsModalTask?.id) {
              refreshTaskCommentCount(commentsModalTask.id)
            }
          }}
        />
      </div>
    </TooltipProvider>
  )
}