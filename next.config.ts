import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows dosya sistemi sorunlarını azaltmak için
  experimental: {
    turbo: {
      // Turbopack cache ayarları
      memoryLimit: 1024,
    },
  },
  // Build optimizasyonları
  swcMinify: true,
  // Development ayarları
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Hot reload gecikmelerini azalt
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

export default nextConfig;
