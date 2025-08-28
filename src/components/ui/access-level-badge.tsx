import { Crown, Users, FolderCheck, FileCheck, CheckSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type AccessLevel = 'OWNER' | 'PROJECT_MEMBER' | 'PROJECT_ASSIGNED' | 'SECTION_ASSIGNED' | 'TASK_ASSIGNED'

interface AccessLevelBadgeProps {
  accessLevel: AccessLevel
  className?: string
  visibleTaskCount?: number
  totalTaskCount?: number
}

export function AccessLevelBadge({ 
  accessLevel, 
  className,
  visibleTaskCount,
  totalTaskCount
}: AccessLevelBadgeProps) {
  const getAccessConfig = () => {
    switch (accessLevel) {
      case 'OWNER':
        return {
          icon: Crown,
          text: 'Sahip',
          variant: 'default' as const,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          tooltip: 'Bu projenin sahibisiniz'
        }
      case 'PROJECT_MEMBER':
        return {
          icon: Users,
          text: 'Üye',
          variant: 'secondary' as const,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          tooltip: 'Bu projenin üyesisiniz'
        }
      case 'PROJECT_ASSIGNED':
        return {
          icon: FolderCheck,
          text: 'Proje Atanmış',
          variant: 'outline' as const,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          tooltip: 'Tüm projeye atanmışsınız'
        }
      case 'SECTION_ASSIGNED':
        return {
          icon: FileCheck,
          text: 'Bölüm Atanmış',
          variant: 'outline' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          tooltip: 'Belirli bölümlere atanmışsınız'
        }
      case 'TASK_ASSIGNED':
        return {
          icon: CheckSquare,
          text: 'Görev Atanmış',
          variant: 'outline' as const,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          tooltip: 'Belirli görevlere atanmışsınız'
        }
      default:
        return {
          icon: Users,
          text: 'Bilinmiyor',
          variant: 'secondary' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          tooltip: 'Erişim seviyesi belirlenmemiş'
        }
    }
  }

  const config = getAccessConfig()
  const Icon = config?.icon

  const tooltipContent = () => {
    if (visibleTaskCount !== undefined && totalTaskCount !== undefined && visibleTaskCount < totalTaskCount) {
      return (
        <div className="space-y-1">
          <p>{config.tooltip}</p>
          <p className="text-sm text-muted-foreground">
            {visibleTaskCount}/{totalTaskCount} görev görüntüleyebilirsiniz
          </p>
        </div>
      )
    }
    return config.tooltip
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border transition-colors",
            config.bgColor,
            config.borderColor,
            config.color,
            className
          )}
        >
          {Icon && <Icon className="h-3 w-3" />}
          <span>{config.text}</span>
          {visibleTaskCount !== undefined && totalTaskCount !== undefined && 
           accessLevel !== 'OWNER' && visibleTaskCount < totalTaskCount && (
            <span className="ml-1 text-[10px] opacity-70">
              {visibleTaskCount}/{totalTaskCount}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {tooltipContent()}
      </TooltipContent>
    </Tooltip>
  )
}