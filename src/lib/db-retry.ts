/**
 * Database Retry Utility
 * Supabase connection timeout sorunları için retry mekanizması
 */

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 saniye
  maxDelay: 10000, // 10 saniye
  backoffMultiplier: 2,
};

/**
 * Sleep utility
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Connection timeout veya network hatalarını tespit eder
 */
const isRetriableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';
  
  // Supabase/Prisma connection hataları
  const retriablePatterns = [
    'can\'t reach database server',
    'connection timeout',
    'connection refused',
    'network error',
    'server timeout',
    'econnreset',
    'econnrefused',
    'etimedout',
    'socket timeout',
    'connection lost',
    'connection closed',
    'timed out fetching a new connection',
    'connection pool',
    'transaction not found',
    'transaction id is invalid',
    'refers to an old closed transaction',
  ];
  
  // HTTP timeout hataları
  const retriableCodes = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETDOWN',
    'ENETUNREACH',
    'EHOSTDOWN',
    'EHOSTUNREACH',
    'P1001', // Prisma connection error
    'P1008', // Prisma timeout
    'P1017', // Prisma server not found
    'P2024', // Timed out fetching connection
    'P2028', // Transaction timeout
  ];
  
  return retriablePatterns.some(pattern => errorMessage.includes(pattern)) ||
         retriableCodes.includes(errorCode);
};

/**
 * Exponential backoff ile retry mekanizması
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // İlk denemede başarılı olmazsa log
      if (attempt > 1) {
        console.log(`Database operation succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Son deneme ise hata fırlat
      if (attempt === opts.maxAttempts) {
        console.error(`Database operation failed after ${opts.maxAttempts} attempts:`, error);
        break;
      }
      
      // Retry edilebilir hata mı kontrol et
      if (!isRetriableError(error)) {
        console.error('Non-retriable database error:', error);
        throw error;
      }
      
      // Exponential backoff hesapla
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      console.warn(`Database operation failed on attempt ${attempt}, retrying in ${delay}ms:`, error?.message);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Database transaction'ları için retry wrapper
 */
export async function withTransactionRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3, // Transaction'larda daha fazla retry
    baseDelay: 1000, // Daha uzun delay
    maxDelay: 5000,
    ...options,
  });
}

/**
 * Sadece read operation'ları için retry wrapper
 */
export async function withReadRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5, // Read'lerde daha fazla retry
    baseDelay: 500,
    ...options,
  });
}

/**
 * Kritik operation'lar için retry wrapper (daha agresif)
 */
export async function withCriticalRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 15000,
    ...options,
  });
}