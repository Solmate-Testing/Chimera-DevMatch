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
  
  // Environment variables - Import from root .env.local
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_BICONOMY_BUNDLER_URL: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL,
    NEXT_PUBLIC_BICONOMY_PAYMASTER_URL: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL,
    NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY,
    NEXT_PUBLIC_SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
    NEXT_PUBLIC_MARKETPLACE_ADDRESS: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
    NEXT_PUBLIC_SAPPHIRE_PUBLIC_KEY: process.env.NEXT_PUBLIC_SAPPHIRE_PUBLIC_KEY,
    WEB3_STORAGE_TOKEN: process.env.WEB3_STORAGE_TOKEN,
  },
};

module.exports = nextConfig;