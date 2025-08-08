"use client";

/**
 * Providers Component
 * 
 * Sets up the application's Web3 provider hierarchy for gasless transactions.
 * Configures Privy for Google OAuth + smart wallets and React Query for data fetching.
 * 
 * Provider Stack:
 * - QueryClientProvider: React Query for async state management
 * - PrivyProvider: Google OAuth + ERC-4337 smart wallet creation
 * 
 * Features:
 * - Web2 onboarding with Google login
 * - Automatic smart wallet creation (no MetaMask required)
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PRIVY_CONFIG } from '../lib/privy-config';

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
  
  if (!privyAppId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables');
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p>NEXT_PUBLIC_PRIVY_APP_ID environment variable is missing</p>
          <p className="text-sm mt-2">Please check your .env.local file</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={privyAppId}
        config={PRIVY_CONFIG}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}