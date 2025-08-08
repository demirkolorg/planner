import { PrismaClient } from '../generated/prisma';

// Global değişken tanımlaması - geliştirme ortamında Prisma instance'ını saklar
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Gelişmiş Prisma client konfigürasyonu - Supabase optimizasyonları
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool ayarları
    // https://www.prisma.io/docs/concepts/components/prisma-client/connection-pool
    __internal: {
      engine: {
        // Connection pool ayarları
        connection_limit: 10, // Maximum 10 connection
        pool_timeout: 10, // 10 saniye timeout
        schema_cache_size: 100, // Schema cache boyutu
      },
    },
    // Log seviyesi - production'da sadece error
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  });
};

// Prisma client instance'ını oluşturur veya mevcut olanı kullanır
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Geliştirme ortamında global değişkene atar (hot reload için)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Connection durumunu test etmek için helper fonksiyon
export const testConnection = async (): Promise<boolean> => {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Graceful shutdown için connection'ları kapat
export const disconnectDB = async (): Promise<void> => {
  try {
    await db.$disconnect();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
};

// Process exit handler - graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectDB();
  });

  process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
  });
}