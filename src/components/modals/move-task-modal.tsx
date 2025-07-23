"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Search, Folder, Move, FileText } from "lucide-react"
import { useProjectStore } from "@/store/projectStore"

interface MoveTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onMove: (targetProjectId: string, targetSectionId: string | null) => Promise<void>
  task: {
    id: string
    title: string
    projectId: string
    sectionId?: string
  } | null
  currentProject?: {
    id: string
    name: string
    emoji?: string
  }
  mode?: 'move' | 'clone'
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

interface Section {
  id: string
  name: string
  projectId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export function MoveTaskModal({ 
  isOpen, 
  onClose, 
  onMove, 
  task, 
  currentProject,
  mode = 'move'
}: MoveTaskModalProps) {
  const [searchInput, setSearchInput] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  const [availableSections, setAvailableSections] = useState<Section[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const { projects, fetchProjects, getSectionsByProject, fetchSections } = useProjectStore()

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchInput.toLowerCase()) &&
    project.id !== currentProject?.id // Mevcut projeyi gösterme
  )

  useEffect(() => {
    if (isOpen) {
      fetchProjects()
    }
  }, [isOpen, fetchProjects])

  // Modal açıldığında ilk projeyi otomatik seç
  useEffect(() => {
    if (isOpen && filteredProjects.length > 0 && !selectedProject) {
      setSelectedProject(filteredProjects[0])
    }
  }, [isOpen, filteredProjects, selectedProject])

  // Proje seçildiğinde o projenin bölümlerini getir
  useEffect(() => {
    if (selectedProject) {
      const fetchProjectSections = async () => {
        setIsLoadingSections(true)
        try {
          // İlk olarak o projenin sections'larını API'dan çek
          await fetchSections(selectedProject.id)
          // Sonra store'dan al
          const sections = getSectionsByProject(selectedProject.id)
          setAvailableSections(sections)
          // İlk bölümü otomatik seç
          if (sections.length > 0) {
            setSelectedSection(sections[0])
          } else {
            setSelectedSection(null)
          }
        } catch (error) {
          console.error('Failed to fetch sections:', error)
          setAvailableSections([])
        } finally {
          setIsLoadingSections(false)
        }
      }
      
      fetchProjectSections()
    } else {
      setAvailableSections([])
      setSelectedSection(null)
      setIsLoadingSections(false)
    }
  }, [selectedProject, getSectionsByProject, fetchSections])

  const handleMove = async () => {
    if (!selectedProject || !task) return
    
    setIsMoving(true)
    try {
      await onMove(selectedProject.id, selectedSection?.id || null)
      onClose()
    } catch (error) {
      console.error("Failed to move task:", error)
    } finally {
      setIsMoving(false)
    }
  }

  const handleClose = () => {
    setSearchInput("")
    setSelectedProject(null)
    setSelectedSection(null)
    setAvailableSections([])
    setIsLoadingSections(false)
    onClose()
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] fixed left-[50%] top-[20%] translate-x-[-50%] translate-y-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <DialogTitle className="text-lg font-semibold flex items-center">
            <Move className="w-5 h-5 mr-2" />
            {mode === 'clone' ? 'Görevi Klonla' : 'Görevi Taşı'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Görev Bilgisi */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">
              &quot;{task.title}&quot;
            </p>
            <p className="text-xs text-muted-foreground">
              {currentProject?.emoji} {currentProject?.name} → Hedef proje seçin
            </p>
          </div>

          {/* İki Sütunlu Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sol: Proje Seçimi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Hedef Proje</label>
                <span className="text-xs text-muted-foreground">{filteredProjects.length} proje</span>
              </div>
              
              {/* Proje Arama */}
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Proje ara..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Proje Listesi */}
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredProjects.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {searchInput ? "Proje bulunamadı" : "Başka proje yok"}
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-2 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors ${
                        selectedProject?.id === project.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded bg-primary/10">
                          {project.emoji ? (
                            <span className="text-xs">{project.emoji}</span>
                          ) : (
                            <Folder className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{project.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {project._count?.tasks || 0} görev
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sağ: Bölüm Seçimi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Hedef Bölüm</label>
                {selectedProject && (
                  <span className="text-xs text-muted-foreground">
                    {isLoadingSections ? "Yükleniyor..." : `${availableSections.length} bölüm`}
                  </span>
                )}
              </div>

              {selectedProject ? (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {isLoadingSections ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      Bölümler yükleniyor...
                    </div>
                  ) : (
                    <>
                      {availableSections.map((section) => (
                        <div
                          key={section.id}
                          className={`p-2 border-b last:border-b-0 cursor-pointer hover:bg-accent transition-colors ${
                            selectedSection?.id === section.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setSelectedSection(section)}
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="text-xs">{section.name}</span>
                          </div>
                        </div>
                      ))}
                      
                      {!isLoadingSections && availableSections.length === 0 && (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          Bu projede bölüm yok
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="h-64 border rounded-lg flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Proje seçin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isMoving}>
            İptal
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedProject || !selectedSection || isMoving}
            className="min-w-[80px]"
          >
            {isMoving 
              ? (mode === 'clone' ? "Klonlanıyor..." : "Taşınıyor...") 
              : (mode === 'clone' ? "Klonla" : "Taşı")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}