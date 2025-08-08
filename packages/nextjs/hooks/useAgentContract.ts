/**
 * useAgentContract Hook
 * 
 * Hook for interacting with the Marketplace.sol contract
 * Specifically for agent-related operations
 */

import { useState, useCallback } from 'react';
import { useScaffoldWriteContract } from './scaffold-eth/useScaffoldWriteContract';
import { useScaffoldReadContract } from './scaffold-eth/useScaffoldReadContract';
import { usePrivy } from '@privy-io/react-auth';

// Types
export interface AgentCreationData {
  name: string;
  description: string;
  tags: string[];
  ipfsHash: string;
  encryptedApiKey: `0x${string}`;
  isPrivate: boolean;
}

export interface AgentStakeData {
  agentId: bigint;
  amount: bigint;
}

export interface ContractError {
  message: string;
  code?: string;
  reason?: string;
}

export interface TransactionStatus {
  status: 'idle' | 'preparing' | 'pending' | 'success' | 'error';
  hash?: string;
  error?: ContractError;
}

// Hook
export const useAgentContract = () => {
  const { authenticated } = usePrivy();
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ status: 'idle' });

  // Contract write operations
  const { writeContractAsync, isPending: isWritePending } = useScaffoldWriteContract('Marketplace');
  
  // Contract read operations
  const { data: agentCount } = useScaffoldReadContract({
    contractName: 'Marketplace',
    functionName: 'getAgentCount',
  });

  /**
   * Create a new AI agent
   */
  const createAgent = useCallback(async (data: AgentCreationData): Promise<string | null> => {
    if (!authenticated) {
      throw new Error('Please connect your wallet first');
    }

    setTransactionStatus({ status: 'preparing' });

    try {
      const hash = await writeContractAsync({
        functionName: 'createAgent',
        args: [
          data.name,
          data.description,
          data.tags,
          data.ipfsHash,
          data.encryptedApiKey,
          data.isPrivate,
        ],
      });

      setTransactionStatus({ status: 'pending', hash });

      // In production, wait for transaction confirmation
      // For now, we'll simulate success after a delay
      setTimeout(() => {
        setTransactionStatus({ status: 'success', hash });
      }, 2000);

      return hash;

    } catch (error: any) {
      const contractError: ContractError = {
        message: error.message || 'Transaction failed',
        code: error.code,
        reason: error.reason,
      };
      
      setTransactionStatus({ status: 'error', error: contractError });
      throw contractError;
    }
  }, [authenticated, writeContractAsync]);

  /**
   * Stake on an agent
   */
  const stakeOnAgent = useCallback(async (data: AgentStakeData): Promise<string | null> => {
    if (!authenticated) {
      throw new Error('Please connect your wallet first');
    }

    setTransactionStatus({ status: 'preparing' });

    try {
      const hash = await writeContractAsync({
        functionName: 'stakeToAgent',
        args: [data.agentId],
        value: data.amount,
      });

      setTransactionStatus({ status: 'pending', hash });

      // Simulate success
      setTimeout(() => {
        setTransactionStatus({ status: 'success', hash });
      }, 2000);

      return hash;

    } catch (error: any) {
      const contractError: ContractError = {
        message: error.message || 'Staking failed',
        code: error.code,
        reason: error.reason,
      };
      
      setTransactionStatus({ status: 'error', error: contractError });
      throw contractError;
    }
  }, [authenticated, writeContractAsync]);

  /**
   * Love an agent
   */
  const loveAgent = useCallback(async (agentId: bigint): Promise<string | null> => {
    if (!authenticated) {
      throw new Error('Please connect your wallet first');
    }

    setTransactionStatus({ status: 'preparing' });

    try {
      const hash = await writeContractAsync({
        functionName: 'loveAgent',
        args: [agentId],
      });

      setTransactionStatus({ status: 'pending', hash });

      setTimeout(() => {
        setTransactionStatus({ status: 'success', hash });
      }, 1000);

      return hash;

    } catch (error: any) {
      const contractError: ContractError = {
        message: error.message || 'Love action failed',
        code: error.code,
        reason: error.reason,
      };
      
      setTransactionStatus({ status: 'error', error: contractError });
      throw contractError;
    }
  }, [authenticated, writeContractAsync]);

  /**
   * Grant access to private agent
   */
  const grantAgentAccess = useCallback(async (agentId: bigint, userAddress: `0x${string}`): Promise<string | null> => {
    if (!authenticated) {
      throw new Error('Please connect your wallet first');
    }

    setTransactionStatus({ status: 'preparing' });

    try {
      const hash = await writeContractAsync({
        functionName: 'grantAgentAccess',
        args: [agentId, userAddress],
      });

      setTransactionStatus({ status: 'pending', hash });

      setTimeout(() => {
        setTransactionStatus({ status: 'success', hash });
      }, 1500);

      return hash;

    } catch (error: any) {
      const contractError: ContractError = {
        message: error.message || 'Access grant failed',
        code: error.code,
        reason: error.reason,
      };
      
      setTransactionStatus({ status: 'error', error: contractError });
      throw contractError;
    }
  }, [authenticated, writeContractAsync]);

  /**
   * Reset transaction status
   */
  const resetStatus = useCallback(() => {
    setTransactionStatus({ status: 'idle' });
  }, []);

  /**
   * Format contract error for display
   */
  const formatError = useCallback((error: ContractError): string => {
    if (error.message.includes('user rejected')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient ETH balance for this transaction';
    }
    if (error.message.includes('Invalid agent ID')) {
      return 'Agent not found or invalid';
    }
    if (error.message.includes('Not authorized TEE')) {
      return 'Security validation failed - please try again';
    }
    if (error.message.includes('API key required')) {
      return 'API key is required for agent creation';
    }
    if (error.message.includes('Minimum stake')) {
      return 'Minimum stake of 0.01 ETH required';
    }
    
    return error.message || 'Transaction failed - please try again';
  }, []);

  return {
    // Actions
    createAgent,
    stakeOnAgent,
    loveAgent,
    grantAgentAccess,
    resetStatus,
    formatError,
    
    // State
    transactionStatus,
    isLoading: transactionStatus.status === 'preparing' || transactionStatus.status === 'pending',
    isPending: isWritePending || transactionStatus.status === 'pending',
    
    // Data
    agentCount,
  };
};