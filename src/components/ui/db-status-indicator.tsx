"use client"

import { useState, useEffect } from "react"
import { Database, Wifi, WifiOff, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DbHealthStatus {
  status: 'healthy' | 'unhealthy'
  database: {
    status: string
    connectionTime: string
    metrics?: {
      healthStatus: 'healthy' | 'warning' | 'critical'
      totalRequests: number
      failedRequests: number
      averageResponseTime: string
    }
  }
  timestamp: string
}

export function DbStatusIndicator() {
  const [status, setStatus] = useState<DbHealthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkDbHealth = async () => {
    if (isChecking) return
    
    setIsChecking(true)
    try {
      const response = await fetch('/api/health/db', {
        cache: 'no-store'
      })
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check database health:', error)
      setStatus({
        status: 'unhealthy',
        database: {
          status: 'error',
          connectionTime: 'unknown'
        },
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDbHealth()
    
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkDbHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    // Loading state ile menü boyutunu sabit tut
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled
              className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-colors text-gray-400"
            >
              <Database className="h-4 w-4 animate-pulse" />
              <span className="hidden sm:inline">Kontrol...</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Database durumu yükleniyor...
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const getStatusIcon = () => {
    if (isChecking) {
      return <Database className="h-4 w-4 animate-pulse text-blue-500" />
    }

    if (status.status === 'healthy') {
      return <Wifi className="h-4 w-4 text-green-500" />
    }

    return <WifiOff className="h-4 w-4 text-red-500" />
  }

  const getStatusColor = () => {
    if (isChecking) return 'text-blue-500'
    if (status.status === 'healthy') {
      // Metrics varsa health status'una bak
      if (status.database.metrics?.healthStatus === 'critical') return 'text-red-500'
      if (status.database.metrics?.healthStatus === 'warning') return 'text-yellow-500'
      return 'text-green-500'
    }
    return 'text-red-500'
  }

  const getTooltipContent = () => {
    if (isChecking) return "Database durumu kontrol ediliyor..."
    
    if (status.status === 'healthy') {
      const metrics = status.database.metrics
      return (
        <div className="text-xs space-y-1">
          <div>Durum: Bağlı</div>
          <div>Bağlantı Süresi: {status.database.connectionTime}</div>
          {metrics && (
            <>
              <div>Ortalama Yanıt: {metrics.averageResponseTime}</div>
              <div>Başarısız: {metrics.failedRequests}/{metrics.totalRequests}</div>
              <div>Sağlık: {metrics.healthStatus === 'healthy' ? '✅' : metrics.healthStatus === 'warning' ? '⚠️' : '🚨'}</div>
            </>
          )}
          <div className="text-muted-foreground">Son Kontrol: {new Date(status.timestamp).toLocaleTimeString()}</div>
        </div>
      )
    }

    return (
      <div className="text-xs space-y-1">
        <div>Durum: Bağlantı Sorunu</div>
        <div>Bağlantı Süresi: {status.database.connectionTime}</div>
        <div className="text-muted-foreground">Son Kontrol: {new Date(status.timestamp).toLocaleTimeString()}</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={checkDbHealth}
            disabled={isChecking}
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-colors",
              "hover:bg-secondary/50 disabled:cursor-not-allowed",
              getStatusColor()
            )}
          >
            {getStatusIcon()}
            <span className="hidden sm:inline">
              {isChecking ? 'Kontrol...' : status.status === 'healthy' ? 'DB Bağlı' : 'DB Hata'}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}