import { NextRequest, NextResponse } from 'next/server'
import { dbMonitor } from '@/middleware/db-monitor'

export async function GET(request: NextRequest) {
  try {
    const metrics = dbMonitor.getMetrics()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        ...metrics,
        failureRate: metrics.totalRequests > 0 
          ? `${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%` 
          : '0%',
        averageResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Failed to get database metrics:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve database metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Reset metrics
    dbMonitor.reset()
    
    return NextResponse.json({
      message: 'Database metrics reset successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to reset database metrics:', error)
    
    return NextResponse.json({
      error: 'Failed to reset database metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}