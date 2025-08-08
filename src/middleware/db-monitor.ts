/**
 * Database Performance Monitoring Middleware
 */

interface DbMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  connectionErrors: number;
  lastError?: {
    timestamp: string;
    error: string;
  };
}

class DatabaseMonitor {
  private metrics: DbMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    connectionErrors: 0,
  };

  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 100; // Son 100 request'in ortalamasını tut

  recordRequest(responseTime: number, success: boolean, error?: any) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      
      // Connection error mı kontrol et
      if (this.isConnectionError(error)) {
        this.metrics.connectionErrors++;
      }
      
      // Son hatayı kaydet
      this.metrics.lastError = {
        timestamp: new Date().toISOString(),
        error: error?.message || 'Unknown error'
      };
    }

    // Response time kaydet ve ortalama hesapla
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const connectionPatterns = [
      'can\'t reach database server',
      'connection timeout',
      'connection refused',
      'econnreset',
      'econnrefused',
      'etimedout',
    ];
    
    return connectionPatterns.some(pattern => errorMessage.includes(pattern));
  }

  getMetrics(): DbMetrics & { healthStatus: 'healthy' | 'warning' | 'critical' } {
    const failureRate = this.metrics.totalRequests > 0 
      ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
      : 0;

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (failureRate > 20 || this.metrics.connectionErrors > 5) {
      healthStatus = 'critical';
    } else if (failureRate > 5 || this.metrics.connectionErrors > 2 || this.metrics.averageResponseTime > 2000) {
      healthStatus = 'warning';
    }

    return {
      ...this.metrics,
      healthStatus,
    };
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      connectionErrors: 0,
    };
    this.responseTimes = [];
  }

  // Periyodik log için
  logMetricsIfNeeded() {
    const metrics = this.getMetrics();
    
    if (metrics.healthStatus === 'critical') {
      console.error('🚨 Database Health CRITICAL:', {
        failureRate: `${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%`,
        connectionErrors: metrics.connectionErrors,
        averageResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
        lastError: metrics.lastError
      });
    } else if (metrics.healthStatus === 'warning') {
      console.warn('⚠️ Database Health WARNING:', {
        failureRate: `${((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)}%`,
        connectionErrors: metrics.connectionErrors,
        averageResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
      });
    }
  }
}

// Singleton instance
export const dbMonitor = new DatabaseMonitor();

// Periyodik health check (her 5 dakikada bir)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    dbMonitor.logMetricsIfNeeded();
  }, 5 * 60 * 1000); // 5 dakika
}

/**
 * Database operation wrapper with monitoring
 */
export async function withDbMonitoring<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const responseTime = Date.now() - startTime;
    
    dbMonitor.recordRequest(responseTime, true);
    
    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    dbMonitor.recordRequest(responseTime, false, error);
    
    console.error(`Database operation failed${operationName ? ` (${operationName})` : ''}:`, {
      error: error instanceof Error ? error.message : error,
      responseTime: `${responseTime}ms`
    });
    
    throw error;
  }
}