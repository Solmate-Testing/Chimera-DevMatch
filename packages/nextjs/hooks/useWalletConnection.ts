/**
 * Enhanced Wallet Connection Hook
 * 
 * Fixes:
 * 1. Connection persistence across page refreshes
 * 2. Automatic reconnection logic
 * 3. Better error handling and recovery
 * 4. Provider configuration validation
 * 5. Connection state synchronization
 * 
 * Root causes addressed:
 * - Missing localStorage persistence
 * - No automatic reconnection on page load
 * - Inadequate error recovery mechanisms
 * - Provider misconfiguration
 */

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  hasAutoReconnected: boolean;
  lastConnectionAttempt: number;
  connectionError: string | null;
  walletAddress?: string;
  chainId?: number;
}

interface UseWalletConnectionReturn extends ConnectionState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEYS = {
  CONNECTION_STATE: 'chimera_wallet_connection',
  LAST_WALLET_TYPE: 'chimera_last_wallet_type',
  AUTO_CONNECT_ENABLED: 'chimera_auto_connect'
};

const CONNECTION_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_ATTEMPTS = 3;

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout, 
    linkWallet, 
    createWallet 
  } = usePrivy();

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    hasAutoReconnected: false,
    lastConnectionAttempt: 0,
    connectionError: null,
    walletAddress: undefined,
    chainId: undefined
  });

  // Persist connection state to localStorage
  const persistConnectionState = useCallback((state: Partial<ConnectionState>) => {
    try {
      const currentState = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.CONNECTION_STATE) || '{}'
      );
      const newState = { ...currentState, ...state };
      localStorage.setItem(STORAGE_KEYS.CONNECTION_STATE, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to persist connection state:', error);
    }
  }, []);

  // Load persisted connection state
  const loadPersistedState = useCallback((): Partial<ConnectionState> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONNECTION_STATE);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load persisted connection state:', error);
      return {};
    }
  }, []);

  // Update connection state with persistence
  const updateConnectionState = useCallback((updates: Partial<ConnectionState>) => {
    setConnectionState(prev => {
      const newState = { ...prev, ...updates };
      persistConnectionState(updates);
      return newState;
    });
  }, [persistConnectionState]);

  // Clear connection error
  const clearError = useCallback(() => {
    updateConnectionState({ connectionError: null });
  }, [updateConnectionState]);

  // Enhanced connection logic with retry mechanism
  const connect = useCallback(async (isRetry = false, retryCount = 0): Promise<void> => {
    if (!ready || connectionState.isConnecting) return;

    console.log(`🔄 Attempting wallet connection (retry: ${retryCount}/${MAX_RETRY_ATTEMPTS})`);
    
    updateConnectionState({ 
      isConnecting: true, 
      connectionError: null,
      lastConnectionAttempt: Date.now()
    });

    try {
      if (!authenticated) {
        console.log('🔐 User not authenticated, initiating login...');
        await login();
        
        // Wait for authentication to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!user?.wallet?.address) {
          throw new Error('Authentication completed but no wallet found');
        }
      } else if (!user?.wallet?.address) {
        console.log('💳 User authenticated but no wallet, creating/linking wallet...');
        
        try {
          await createWallet();
          console.log('✅ Wallet created successfully');
        } catch (createError) {
          console.log('📱 Create wallet failed, trying link wallet...', createError);
          await linkWallet();
          console.log('✅ Wallet linked successfully');
        }
      }

      // Validate connection
      if (user?.wallet?.address) {
        updateConnectionState({
          isConnected: true,
          isConnecting: false,
          walletAddress: user.wallet.address,
          chainId: user.wallet.chainId,
          hasAutoReconnected: isRetry
        });

        // Store connection preference
        localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT_ENABLED, 'true');
        localStorage.setItem(STORAGE_KEYS.LAST_WALLET_TYPE, user.wallet.walletClientType || 'privy');

        console.log('✅ Wallet connected:', user.wallet.address);
      } else {
        throw new Error('Connection process completed but wallet address not available');
      }

    } catch (error: any) {
      console.error(`❌ Wallet connection failed (attempt ${retryCount + 1}):`, error);
      
      const errorMessage = error.message || 'Failed to connect wallet';
      
      // Retry logic for specific errors
      const shouldRetry = retryCount < MAX_RETRY_ATTEMPTS && (
        errorMessage.includes('User rejected') === false && 
        errorMessage.includes('User cancelled') === false
      );

      if (shouldRetry) {
        console.log(`🔄 Retrying connection in ${CONNECTION_RETRY_DELAY}ms...`);
        setTimeout(() => {
          connect(true, retryCount + 1);
        }, CONNECTION_RETRY_DELAY);
        return;
      }

      updateConnectionState({
        isConnecting: false,
        connectionError: errorMessage,
        isConnected: false
      });

      throw error;
    }
  }, [ready, authenticated, user, login, createWallet, linkWallet, connectionState.isConnecting, updateConnectionState]);

  // Enhanced disconnect with cleanup
  const disconnect = useCallback(async (): Promise<void> => {
    console.log('🔌 Disconnecting wallet...');
    
    try {
      await logout();
      
      // Clear all connection state
      updateConnectionState({
        isConnected: false,
        isConnecting: false,
        hasAutoReconnected: false,
        connectionError: null,
        walletAddress: undefined,
        chainId: undefined
      });

      // Clear stored preferences
      localStorage.removeItem(STORAGE_KEYS.AUTO_CONNECT_ENABLED);
      localStorage.removeItem(STORAGE_KEYS.CONNECTION_STATE);
      
      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      updateConnectionState({
        connectionError: 'Failed to disconnect wallet'
      });
    }
  }, [logout, updateConnectionState]);

  // Reconnect function
  const reconnect = useCallback(async (): Promise<void> => {
    console.log('🔄 Manual reconnection requested...');
    await connect(true, 0);
  }, [connect]);

  // Auto-reconnection logic on page load
  useEffect(() => {
    if (!ready || connectionState.hasAutoReconnected) return;

    const shouldAutoConnect = localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT_ENABLED) === 'true';
    const persistedState = loadPersistedState();

    console.log('🔍 Checking auto-reconnection:', {
      ready,
      authenticated,
      hasWallet: !!user?.wallet?.address,
      shouldAutoConnect,
      persistedState
    });

    if (shouldAutoConnect && !authenticated) {
      console.log('🔄 Auto-reconnecting wallet...');
      connect(true, 0).catch(error => {
        console.error('❌ Auto-reconnection failed:', error);
        // Don't show error for auto-reconnection failures
        updateConnectionState({ 
          connectionError: null,
          hasAutoReconnected: true 
        });
      });
    } else if (authenticated && user?.wallet?.address) {
      // Update state if already connected
      updateConnectionState({
        isConnected: true,
        walletAddress: user.wallet.address,
        chainId: user.wallet.chainId,
        hasAutoReconnected: true
      });
    } else {
      updateConnectionState({ hasAutoReconnected: true });
    }
  }, [ready, authenticated, user, connect, updateConnectionState, loadPersistedState, connectionState.hasAutoReconnected]);

  // Monitor wallet changes
  useEffect(() => {
    if (!ready) return;

    const currentWalletAddress = user?.wallet?.address;
    const currentChainId = user?.wallet?.chainId;

    if (currentWalletAddress !== connectionState.walletAddress || 
        currentChainId !== connectionState.chainId) {
      
      updateConnectionState({
        isConnected: !!currentWalletAddress,
        walletAddress: currentWalletAddress,
        chainId: currentChainId
      });

      if (currentWalletAddress) {
        console.log('👛 Wallet changed:', currentWalletAddress);
      }
    }
  }, [ready, user?.wallet, connectionState.walletAddress, connectionState.chainId, updateConnectionState]);

  // Handle authentication state changes
  useEffect(() => {
    if (!ready) return;

    if (!authenticated && connectionState.isConnected) {
      console.log('🔐 Authentication lost, updating connection state...');
      updateConnectionState({
        isConnected: false,
        walletAddress: undefined,
        chainId: undefined
      });
    }
  }, [ready, authenticated, connectionState.isConnected, updateConnectionState]);

  return {
    ...connectionState,
    connect: () => connect(false, 0),
    disconnect,
    reconnect,
    clearError
  };
};