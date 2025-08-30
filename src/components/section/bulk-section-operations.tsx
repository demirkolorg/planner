"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Trash2, 
  Move, 
  Copy, 
  Archive, 
  Tag,
  Users,
  Settings,
  Download,
  Loader2,
  Target,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Section } from "./draggable-section-list"
import { toast } from "sonner"

interface BulkSectionOperationsProps {
  sections: Section[]
  selectedSectionIds: string[]
  onSelectionChange: (sectionIds: string[]) => void
  onBulkDelete?: (sectionIds: string[]) => Promise<void>
  onBulkMove?: (sectionIds: string[], targetProjectId: string) => Promise<void>
  onBulkArchive?: (sectionIds: string[]) => Promise<void>
  onBulkTemplate?: (sectionIds: string[]) => Promise<void>
  className?: string
}

export function BulkSectionOperations({
  sections,
  selectedSectionIds,
  onSelectionChange,
  onBulkDelete,
  onBulkMove,
  onBulkArchive,
  onBulkTemplate,
  className
}: BulkSectionOperationsProps) {
  const [isOperationInProgress, setIsOperationInProgress] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<string | null>(null)

  const selectedSections = sections.filter(section => selectedSectionIds.includes(section.id))
  const hasSelection = selectedSectionIds.length > 0
  const isAllSelected = sections.length > 0 && selectedSectionIds.length === sections.length

  // Statistics for selected sections
  const selectedStats = {
    totalTasks: selectedSections.reduce((acc, section) => acc + (section._count?.tasks || 0), 0),
    avgTasksPerSection: selectedSections.length > 0 
      ? Math.round(selectedSections.reduce((acc, section) => acc + (section._count?.tasks || 0), 0) / selectedSections.length)
      : 0,
    emptysections: selectedSections.filter(section => (section._count?.tasks || 0) === 0).length
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(sections.map(s => s.id))
    }
  }

  const handleSectionSelect = (sectionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSectionIds, sectionId])
    } else {
      onSelectionChange(selectedSectionIds.filter(id => id !== sectionId))
    }
  }

  const executeOperation = async (operation: () => Promise<void>, operationName: string) => {
    if (selectedSectionIds.length === 0) return

    setIsOperationInProgress(true)
    setCurrentOperation(operationName)

    try {
      await operation()
      toast.success(`${selectedSectionIds.length} bölüm için ${operationName} işlemi tamamlandı`)
      onSelectionChange([]) // Clear selection after successful operation
    } catch (error) {
      console.error(`Bulk ${operationName} failed:`, error)
      toast.error(`${operationName} işlemi başarısız oldu`)
    } finally {
      setIsOperationInProgress(false)
      setCurrentOperation(null)
    }
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return
    await executeOperation(
      () => onBulkDelete(selectedSectionIds),
      "silme"
    )
    setShowDeleteDialog(false)
  }

  const handleBulkMove = async () => {
    if (!onBulkMove) return
    // In a real implementation, you'd show a project selector
    const targetProjectId = 'sample-project-id'
    await executeOperation(
      () => onBulkMove(selectedSectionIds, targetProjectId),
      "taşıma"
    )
  }

  const handleBulkArchive = async () => {
    if (!onBulkArchive) return
    await executeOperation(
      () => onBulkArchive(selectedSectionIds),
      "arşivleme"
    )
  }

  const handleCreateTemplate = async () => {
    if (!onBulkTemplate) return
    await executeOperation(
      () => onBulkTemplate(selectedSectionIds),
      "şablon oluşturma"
    )
  }

  return (
    <div className={className}>
      {/* Selection Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary"
              />
              <div>
                <p className="font-medium">
                  {hasSelection ? (
                    `${selectedSectionIds.length} bölüm seçildi`
                  ) : (
                    "Bölüm seçin"
                  )}
                </p>
                {hasSelection && (
                  <p className="text-sm text-muted-foreground">
                    Toplam {selectedStats.totalTasks} görev • 
                    Ortalama {selectedStats.avgTasksPerSection} görev/bölüm
                    {selectedStats.emptySeconds > 0 && ` • ${selectedStats.emptySeconds} boş bölüm`}
                  </p>
                )}
              </div>
            </div>

            {hasSelection && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2 py-1">
                  {selectedSectionIds.length}/{sections.length}
                </Badge>

                {/* Bulk Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={isOperationInProgress}
                    >
                      {isOperationInProgress ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {currentOperation}...
                        </>
                      ) : (
                        <>
                          <MoreVertical className="h-4 w-4 mr-2" />
                          İşlemler
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleBulkMove}>
                      <Move className="h-4 w-4 mr-2" />
                      Başka Projeye Taşı
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {}}>
                      <Copy className="h-4 w-4 mr-2" />
                      Kopyala
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleCreateTemplate}>
                      <Tag className="h-4 w-4 mr-2" />
                      Şablon Olarak Kaydet
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {}}>
                      <Download className="h-4 w-4 mr-2" />
                      Dışa Aktar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleBulkArchive}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arşivle
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {}}>
                      <Settings className="h-4 w-4 mr-2" />
                      Toplu Düzenle
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Toplu Sil ({selectedSectionIds.length})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {hasSelection && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Seçim İstatistikleri</CardTitle>
            <CardDescription>
              Seçili bölümler için özet bilgiler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedStats.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Toplam Görev</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedStats.avgTasksPerSection}</p>
                  <p className="text-sm text-muted-foreground">Ort. Görev/Bölüm</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedStats.emptySeconds}</p>
                  <p className="text-sm text-muted-foreground">Boş Bölüm</p>
                </div>
              </div>
            </div>

            {/* Progress bar showing selection coverage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Seçim Oranı</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((selectedSectionIds.length / sections.length) * 100)}%
                </p>
              </div>
              <Progress 
                value={(selectedSectionIds.length / sections.length) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section List with Checkboxes */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isSelected = selectedSectionIds.includes(section.id)
          return (
            <Card key={section.id} className={cn(
              "transition-all duration-200",
              isSelected && "ring-2 ring-primary/20 bg-primary/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => 
                      handleSectionSelect(section.id, checked as boolean)
                    }
                    className="data-[state=checked]:bg-primary"
                  />

                  <div className="flex-1">
                    <h4 className="font-medium">{section.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{section._count?.tasks || 0} görev</span>
                      <span>#{section.order + 1}</span>
                      <span>{new Date(section.updatedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>

                  <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                    {isSelected ? "Seçildi" : "Seçilmedi"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bölümleri Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSectionIds.length} bölümü silmek istediğinizden emin misiniz? 
              Bu bölümlerdeki toplam {selectedStats.totalTasks} görev de silinecek.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isOperationInProgress}
            >
              {isOperationInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}