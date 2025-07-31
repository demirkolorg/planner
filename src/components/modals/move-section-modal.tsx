"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Folder, Move } from "lucide-react"
import { useProjectStore } from "@/store/projectStore"

interface MoveSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onMove: (targetProjectId: string) => Promise<void>
  section: {
    id: string
    name: string
    projectId: string
  } | null
  currentProject?: {
    id: string
    name: string
    emoji?: string
  }
}

interface Project {
  id: string
  name: string
  emoji?: string
  userId: string
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

export function MoveSectionModal({ 
  isOpen, 
  onClose, 
  onMove, 
  section, 
  currentProject 
}: MoveSectionModalProps) {
  const [searchInput, setSearchInput] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const { projects, fetchProjects } = useProjectStore()

  useEffect(() => {
    if (isOpen) {
      setSearchInput("")
      setSelectedProject(null)
      setIsMoving(false)
      fetchProjects()
    }
  }, [isOpen, fetchProjects])

  const handleMove = async () => {
    if (!selectedProject || !section) return

    setIsMoving(true)
    try {
      await onMove(selectedProject.id)
      onClose()
    } catch (error) {
      console.error("Failed to move section:", error)
    } finally {
      setIsMoving(false)
    }
  }

  const getFilteredProjects = () => {
    return projects.filter(project => 
      project.id !== section?.projectId && // Mevcut projeyi hariç tut
      project.name.toLowerCase().includes(searchInput.toLowerCase())
    )
  }

  if (!section) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center space-x-2">
            <Move className="h-5 w-5 text-blue-600" />
            <span>Bölüm Taşı</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Bölüm taşıma penceresi: Bölümü başka bir projeye taşıma ve hedef proje seçimi
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Section Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="font-medium text-sm">{section.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Şu anda: {currentProject?.emoji} {currentProject?.name}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Proje ara..."
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Selected Project */}
          {selectedProject && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{selectedProject.emoji} {selectedProject.name}</span>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Değiştir
                </button>
              </div>
            </div>
          )}

          {/* Project List */}
          {!selectedProject && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {getFilteredProjects().length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">
                  {searchInput ? "Proje bulunamadı" : "Başka proje yok"}
                </div>
              ) : (
                getFilteredProjects().map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center px-3 py-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                    onClick={() => setSelectedProject(project)}
                  >
                    <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm flex-1">{project.emoji} {project.name}</span>
                    {project._count && (
                      <span className="text-xs text-muted-foreground">
                        {project._count.tasks} görev
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isMoving}
            >
              İptal
            </Button>
            <Button 
              onClick={handleMove}
              disabled={!selectedProject || isMoving}
              className="flex-1"
            >
              {isMoving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Taşınıyor...
                </>
              ) : (
                <>
                  <Move className="h-3 w-3 mr-2" />
                  Taşı
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
            <strong>Not:</strong> Bu bölümdeki tüm görevler de seçilen projeye taşınacak.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}