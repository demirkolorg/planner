"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, File, Image, FileText, Plus, X, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Attachment {
  id: string
  taskId: string
  fileName: string
  fileType: string
  fileUrl: string
  fileSize?: number
}

interface FileUploadDropdownProps {
  taskAttachments?: Attachment[]
  onAddAttachment?: (file: File) => void
  onDeleteAttachment?: (attachmentId: string) => void
  trigger?: React.ReactNode
  maxFileSize?: number // MB
  allowedTypes?: string[]
}

export function FileUploadDropdown({ 
  taskAttachments = [], 
  onAddAttachment,
  onDeleteAttachment,
  trigger,
  maxFileSize = 10, // 10MB default
  allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
}: FileUploadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dosya türü ikonu
  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />
    }
    if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4 text-red-500" />
    }
    if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <FileText className="h-4 w-4 text-green-600" />
    }
    if (fileType.startsWith('text/')) {
      return <FileText className="h-4 w-4 text-gray-600" />
    }
    return <File className="h-4 w-4 text-gray-500" />
  }

  // Dosya boyutunu formatla
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Bilinmeyen boyut'
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Dosya yükleme validation
  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Desteklenmeyen dosya türü: ${file.type}`
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Dosya boyutu ${maxFileSize}MB'den büyük olamaz`
    }
    
    return null
  }

  // Dosya yükleme işlemi
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        alert(error) // Gerçek uygulamada toast göster
        continue
      }
      
      setIsUploading(true)
      try {
        await onAddAttachment?.(file)
      } catch (error) {
        console.error('File upload failed:', error)
        alert('Dosya yükleme başarısız') // Gerçek uygulamada toast göster
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Dosya seçme
  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Dosya input değişimi
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(files)
    }
    // Input'u sıfırla
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [])

  // Dosya preview
  const handlePreviewFile = (attachment: Attachment) => {
    if (attachment.fileType.startsWith('image/')) {
      // Resim için modal göster
      window.open(attachment.fileUrl, '_blank')
    } else {
      // Diğer dosyalar için direkt aç
      window.open(attachment.fileUrl, '_blank')
    }
  }

  // Dosya indirme
  const handleDownloadFile = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = attachment.fileUrl
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Dosya Ekle
            {taskAttachments.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {taskAttachments.length}
              </span>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="p-4">
          {/* Drag & Drop Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Dosyaları buraya sürükle veya
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isUploading ? 'Yükleniyor...' : 'Dosya Seç'}
            </Button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Dosya türü bilgisi */}
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Desteklenen formatlar: Resim, PDF, Word, Excel, Metin</p>
            <p>Maksimum dosya boyutu: {maxFileSize}MB</p>
          </div>

          {/* Mevcut Dosyalar */}
          {taskAttachments.length > 0 && (
            <>
              <div className="border-t my-4" />
              <div className="space-y-2">
                <div className="text-sm font-medium">Mevcut Dosyalar ({taskAttachments.length})</div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {taskAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded border"
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        {getFileIcon(attachment.fileType, attachment.fileName)}
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {attachment.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.fileSize)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {/* Preview button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreviewFile(attachment)
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        {/* Download button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadFile(attachment)
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteAttachment?.(attachment.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}