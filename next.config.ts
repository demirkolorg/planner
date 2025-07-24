import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
