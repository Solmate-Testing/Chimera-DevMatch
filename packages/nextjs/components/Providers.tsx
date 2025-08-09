"use client";

/**
 * Providers Component
 * 
 * Sets up the application's Web3 provider hierarchy for gasless transactions.
 * Configures Privy + Wagmi integration for scaffold-eth compatibility.
 * 
 * Provider Stack:
 * - QueryClientProvider: React Query for async state management
 * - WagmiProvider: Web3 connection layer
 * - PrivyProvider: Google OAuth + ERC-4337 smart wallet creation
 * 
 * Features:
 * - Web2 onboarding with Google login
 * - Automatic smart wallet creation (no MetaMask required)
 * - Scaffold-ETH hook compatibility
 * - Gasless transaction support via Biconomy
 * - Optimized caching for blockchain data
 * 
 * @component
 * @example
 * ```tsx
 * <Providers>
 *   <App />
 * </Providers>
 * ```
 * 
 * @author Senior Web3 Infrastructure Engineer
 */

import React from 'react';
import type { FC, ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { PRIVY_CONFIG } from '../lib/privy-config';

/**
 * Wagmi configuration for scaffold-eth compatibility
 * 
 * Configured chains:
 * - Mainnet: Production Ethereum network
 * - Sepolia: Testnet for development
 * - Hardhat: Local development network
 */
const wagmiConfig = getDefaultConfig({
  appName: 'Chimera DevMatch',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'chimera-devmatch',
  chains: [mainnet, sepolia, hardhat],
  ssr: true,
});

/**
 * React Query client configuration for blockchain data caching
 * 
 * Optimized settings:
 * - 5 minute stale time for blockchain data
 * - 10 minute garbage collection time
 * - Automatic refetching on window focus disabled for better UX
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: false, // Better UX for Web3 apps
    },
  },
});

/**
 * Props for the Providers component
 */
interface ProvidersProps {
  /** Child components to wrap with providers */
  children: ReactNode;
}

/**
 * Providers component that sets up Web3 authentication and data fetching
 * 
 * @param props - The component props containing children
 * @returns JSX element wrapping children with necessary providers
 */
export const Providers: FC<ProvidersProps> = ({ children }) => {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // Debug logging
  console.log('🔐 Privy App ID loaded:', privyAppId ? 'Found' : 'Missing');
  console.log('🔐 Using App ID:', privyAppId && privyAppId !== 'your_privy_app_id_here' ? `${privyAppId.slice(0, 8)}...` : 'Placeholder');
  
  // Always render Wagmi provider, but conditionally render Privy
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {privyAppId && privyAppId !== 'your_privy_app_id_here' ? (
          <PrivyProvider
            appId={privyAppId}
            config={PRIVY_CONFIG}
          >
            {children}
          </PrivyProvider>
        ) : (
          <div>
            {/* Development mode fallback */}
            <div className="bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Development Mode
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Privy authentication is not configured. Some features may be limited.
                      <br />
                      To enable full functionality, add your <code>NEXT_PUBLIC_PRIVY_APP_ID</code> to <code>.env.local</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {children}
          </div>
        )}
      </WagmiProvider>
    </QueryClientProvider>
  );
}