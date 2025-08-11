import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  // Connection pool ayarları
  __internal: {
    engine: {
      // Connection pool boyutunu artır
      connection_limit: 10,
      // Connection timeout'u artır
      pool_timeout: 30,
      // Schema cache ayarları
      schema_cache_size: 100,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}