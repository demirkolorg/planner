"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface TaskDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  taskTitle: string
  subTaskCount?: number
}

export function TaskDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  subTaskCount = 0
}: TaskDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")

  // Input value'yu taskTitle ile karşılaştır
  const isInputValid = inputValue.trim() === taskTitle.trim()

  const handleConfirm = async () => {
    if (!isInputValid) return
    
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Task deletion failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setInputValue("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Görevi Sil
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>&quot;{taskTitle}&quot;</strong> görevini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          
          {subTaskCount > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                ⚠️ Bu görevin {subTaskCount} alt görevi var
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Ana görev silindiğinde tüm alt görevler de silinecek.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="task-name-confirmation" className="text-sm font-medium">
              Onaylamak için görev adını yazın:
            </Label>
            <Input
              id="task-name-confirmation"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={taskTitle}
              className="font-mono text-sm"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !isInputValid}
            className="min-w-[100px]"
          >
            {isLoading ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}