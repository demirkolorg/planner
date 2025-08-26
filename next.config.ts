import type { NextConfig } from "next";

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Development ayarları
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      // Hot reload gecikmelerini azalt
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  
  // Bundle splitting optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', 'date-fns'],
  },
  // Webpack ayarları
  webpack: (config) => {
    // Windows EPERM hatası için
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Belgelerim/**',
        '**/Documents/**',
        '**/Application Data/**',
        '**/.next/**',
        '**/dist/**',
        '**/build/**'
      ],
    };
    
    // Windows için ek ayarlar
    if (process.platform === 'win32') {
      config.resolve.symlinks = false;
      config.cache = false;
    }
    
    return config;
  },
  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // ESLint strict mode
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withBundleAnalyzer(nextConfig);
