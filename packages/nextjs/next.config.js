/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Web3 and crypto module handling
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    
    // Handle Web3 externals
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    return config;
  },
  
  // Experimental features (appDir is now default in Next.js 13+)
  experimental: {
    // No longer needed - App Router is default
  },
  
  // Environment variables (automatically loaded from .env.local)
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
  },
};

module.exports = nextConfig;