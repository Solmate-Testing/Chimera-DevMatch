"use client";

/**
 * WalletConnection Component
 * 
 * Displays wallet connection status, Sepolia ETH balance, and handles
 * wallet-related interactions with loading states and error handling.
 * 
 * Features:
 * - Sepolia ETH balance display
 * - Connection status indicators
 * - Loading states for balance fetching
 * - Error handling with retry functionality
 * - Mobile-responsive design
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccountBalance } from '../hooks/scaffold-eth/useAccountBalance';
import { LoadingSpinner } from './LoadingSpinner';
import { 
  WalletIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export const WalletConnection: React.FC = () => {
  const { ready, authenticated, user, login, logout, linkWallet, createWallet } = usePrivy();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Get wallet address from Privy
  const walletAddress = user?.wallet?.address;
  
  // Use Scaffold-ETH hook for balance
  const { 
    data: balance, 
    isError, 
    isLoading, 
    refetch 
  } = useAccountBalance({
    address: walletAddress,
  });

  // Handle wallet connection
  const handleConnect = async () => {
    if (!ready) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!authenticated) {
        // User not logged in at all - need to login first
        console.log('🔐 User not authenticated, logging in...');
        await login();
      } else if (!walletAddress) {
        // User is authenticated but no wallet - try to create/link wallet
        console.log('💳 User authenticated but no wallet, creating wallet...');
        try {
          await createWallet();
        } catch (createError) {
          console.log('📱 Create wallet failed, trying link wallet...');
          await linkWallet();
        }
      } else {
        // User already has wallet - this shouldn't happen in the connect flow
        console.log('✅ User already has wallet:', walletAddress);
      }
    } catch (err: any) {
      console.error('❌ Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
    }
  };

  // Handle balance fetch retry
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    try {
      await refetch();
    } catch (err) {
      setError('Failed to fetch balance');
    } finally {
      setIsRetrying(false);
    }
  };

  // Format balance for display
  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.000';
    const balanceInEth = Number(balance) / 1e18;
    return balanceInEth.toFixed(3);
  };

  // Format address for display
  const formatAddress = (address: string | undefined): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show connect button when not authenticated or no wallet
  if (!ready || !authenticated || !walletAddress) {
    // Determine the display text based on state
    const getStatusText = () => {
      if (!ready) return "Loading...";
      if (!authenticated) return "No Account Connected";
      if (authenticated && !walletAddress) return "Wallet Setup Required";
      return "No Wallet Connected";
    };

    const getButtonText = () => {
      if (!ready) return "Loading...";
      if (!authenticated) return "Connect Account";
      if (authenticated && !walletAddress) return "Setup Wallet";
      return "Connect Wallet";
    };

    return (
      <div className="flex items-center space-x-3">
        {!ready ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-slate-400">Loading...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-slate-400">
              <WalletIcon className="h-4 w-4" />
              <span className="text-sm">{getStatusText()}</span>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting || !ready}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>
                    {!authenticated ? 'Connecting...' : 'Setting up...'}
                  </span>
                </>
              ) : (
                <>
                  <WalletIcon className="h-4 w-4" />
                  <span>{getButtonText()}</span>
                </>
              )}
            </button>
          </>
        )}
        {error && (
          <div className="text-red-400 text-sm max-w-xs">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
        <CheckCircleIcon className="h-4 w-4 text-green-400" />
      </div>

      {/* Wallet Info */}
      <div className="bg-slate-700/50 rounded-lg px-3 py-2 border border-slate-600">
        <div className="flex items-center space-x-3">
          {/* Address */}
          <div className="flex items-center space-x-2">
            <WalletIcon className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-mono text-slate-300">
              {formatAddress(walletAddress)}
            </span>
          </div>

          {/* Balance */}
          <div className="flex items-center space-x-2 border-l border-slate-600 pl-3">
            {isLoading || isRetrying ? (
              <LoadingSpinner size="sm" />
            ) : isError || error ? (
              <div className="flex items-center space-x-1">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                <button
                  onClick={handleRetry}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                  disabled={isRetrying}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-white">
                  {formatBalance(balance)}
                </span>
                <span className="text-xs text-slate-400">SEP</span>
              </div>
            )}
          </div>

          {/* Network Indicator */}
          <div className="flex items-center space-x-1 text-xs">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-slate-400">Sepolia</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleRetry}
          disabled={isLoading || isRetrying}
          className="p-1 text-slate-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
          title="Refresh Balance"
        >
          <ArrowPathIcon 
            className={`h-4 w-4 ${(isLoading || isRetrying) ? 'animate-spin' : ''}`} 
          />
        </button>
        <button
          onClick={handleDisconnect}
          className="px-2 py-1 text-xs text-slate-400 hover:text-red-400 transition-colors duration-200"
          title="Disconnect Wallet"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

/**
 * Compact version for mobile displays
 */
export const WalletConnectionCompact: React.FC = () => {
  const { ready, authenticated, user, login, linkWallet, createWallet } = usePrivy();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletAddress = user?.wallet?.address;
  
  const { 
    data: balance, 
    isError, 
    isLoading 
  } = useAccountBalance({
    address: walletAddress,
  });

  // Handle wallet connection
  const handleConnect = async () => {
    if (!ready) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!authenticated) {
        // User not logged in at all - need to login first
        console.log('🔐 User not authenticated, logging in...');
        await login();
      } else if (!walletAddress) {
        // User is authenticated but no wallet - try to create/link wallet
        console.log('💳 User authenticated but no wallet, creating wallet...');
        try {
          await createWallet();
        } catch (createError) {
          console.log('📱 Create wallet failed, trying link wallet...');
          await linkWallet();
        }
      } else {
        // User already has wallet - this shouldn't happen in the connect flow
        console.log('✅ User already has wallet:', walletAddress);
      }
    } catch (err: any) {
      console.error('❌ Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const formatBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00';
    const balanceInEth = Number(balance) / 1e18;
    return balanceInEth.toFixed(2);
  };

  const formatAddress = (address: string | undefined): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-2)}`;
  };

  if (!ready || !authenticated || !walletAddress) {
    const getButtonText = () => {
      if (!ready) return "Loading...";
      if (!authenticated) return "Connect";
      if (authenticated && !walletAddress) return "Setup";
      return "Connect";
    };

    return (
      <>
        <button
          onClick={handleConnect}
          disabled={isConnecting || !ready}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 disabled:cursor-not-allowed"
        >
          {!ready ? (
            <>
              <LoadingSpinner size="xs" />
              <span>Loading...</span>
            </>
          ) : isConnecting ? (
            <>
              <LoadingSpinner size="xs" />
              <span>{!authenticated ? 'Connecting...' : 'Setting up...'}</span>
            </>
          ) : (
            <>
              <WalletIcon className="h-3 w-3" />
              <span>{getButtonText()}</span>
            </>
          )}
        </button>
        {error && (
          <div className="text-red-400 text-xs mt-1">{error}</div>
        )}
      </>
    );
  }

  return (
    <div className="bg-slate-700/50 rounded-lg px-2 py-1 border border-slate-600">
      <div className="flex items-center space-x-2 text-xs">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="font-mono text-slate-300">
          {formatAddress(walletAddress)}
        </span>
        <span className="text-slate-500">•</span>
        {isLoading ? (
          <LoadingSpinner size="xs" />
        ) : isError ? (
          <ExclamationTriangleIcon className="h-3 w-3 text-red-400" />
        ) : (
          <span className="text-white font-medium">
            {formatBalance(balance)} SEP
          </span>
        )}
      </div>
    </div>
  );
};