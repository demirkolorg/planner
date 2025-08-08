import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'
import { withReadRetry } from '@/lib/db-retry'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Retry ile database connection test
    const isConnected = await withReadRetry(async () => {
      return await testConnection()
    }, {
      maxAttempts: 3,
      baseDelay: 500,
    })
    
    const responseTime = Date.now() - startTime
    
    if (isConnected) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        error: 'Database connection test failed'
      }, { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 
          'Expires': '0'
        }
      })
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// Health check endpoint için OPTIONS method
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}