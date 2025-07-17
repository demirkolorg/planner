import { PrismaClient } from '../generated/prisma';

// Global değişken tanımlaması - geliştirme ortamında Prisma instance'ını saklar
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma client instance'ını oluşturur veya mevcut olanı kullanır
export const db = globalForPrisma.prisma ?? new PrismaClient();

// Geliştirme ortamında global değişkene atar (hot reload için)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}