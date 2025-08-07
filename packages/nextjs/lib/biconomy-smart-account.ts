// BICONOMY SMART ACCOUNT IMPLEMENTATION
// Senior Web3 UX Engineer - Gasless Transaction Flow

import { useState, useCallback } from 'react';

// ✅ SMART ACCOUNT INTERFACE FOR GASLESS TRANSACTIONS
export interface SmartAccountInterface {
  address: string;
  isDeployed: boolean;
  sendTransaction: (tx: TransactionRequest) => Promise<TransactionResponse>;
  sendBatchTransactions: (txs: TransactionRequest[]) => Promise<TransactionResponse>;
  getBalance: () => Promise<string>;
}

export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
  userOpHash?: string; // ERC-4337 UserOperation hash
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: number;
  paymasterUsed?: string; // ✅ CRITICAL: Track paymaster usage
}

// ✅ GASLESS SMART ACCOUNT HOOK
export function useBiconomySmartAccount(privyUser: any) {
  const [smartAccount, setSmartAccount] = useState<SmartAccountInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ INITIALIZE SMART ACCOUNT - NO METAMASK POPUP
  const initializeSmartAccount = useCallback(async () => {
    if (!privyUser) return null;

    setIsLoading(true);
    setError(null);

    try {
      // ✅ LOCAL DEVELOPMENT - MOCK SMART ACCOUNT
      if (process.env.NODE_ENV === 'development') {
        const mockSmartAccount: SmartAccountInterface = {
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          isDeployed: true,
          
          // ✅ MOCK GASLESS TRANSACTION
          sendTransaction: async (tx: TransactionRequest): Promise<TransactionResponse> => {
            console.log('🏠 LOCAL DEVELOPMENT - Mock Gasless Transaction:');
            console.log('   To:', tx.to);
            console.log('   Data:', tx.data?.substring(0, 20) + '...');
            console.log('   ✅ NO GAS FEE - PAID BY DAPP');
            console.log('   ⚡ Simulating gasless flow...');

            // Simulate transaction processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

            return {
              hash: mockTxHash,
              userOpHash: `0x${Math.random().toString(16).substr(2, 64)}`,
              wait: async (): Promise<TransactionReceipt> => {
                // Simulate block confirmation
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return {
                  transactionHash: mockTxHash,
                  blockNumber: Math.floor(Math.random() * 1000000),
                  gasUsed: '0', // ✅ ZERO GAS USED BY USER
                  status: 1,
                  paymasterUsed: '0x1234567890123456789012345678901234567890' // ✅ PAYMASTER ADDRESS
                };
              }
            };
          },

          sendBatchTransactions: async (txs: TransactionRequest[]): Promise<TransactionResponse> => {
            console.log(`🏠 BATCH TRANSACTION - ${txs.length} operations gasless`);
            // Use sendTransaction for single batch
            return await this.sendTransaction({
              to: txs[0].to,
              data: `batch_${txs.length}_operations`
            });
          },

          getBalance: async (): Promise<string> => {
            return '0'; // Smart account balance (not relevant for gasless)
          }
        };

        setSmartAccount(mockSmartAccount);
        console.log('✅ Mock Smart Account initialized:', mockSmartAccount.address);
        return mockSmartAccount;
      }

      // ✅ PRODUCTION - REAL BICONOMY SMART ACCOUNT
      else {
        console.log('🔗 Initializing Biconomy Smart Account...');
        
        // Note: In production, use real Biconomy SDK
        // const smartAccount = await createSmartAccountClient({
        //   signer: privyUser.wallet.provider,
        //   bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL,
        //   paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL,
        // });

        // For now, use mock in all environments
        throw new Error('Production Biconomy integration pending - use development mode');
      }

    } catch (err: any) {
      console.error('❌ Smart Account initialization failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [privyUser]);

  // ✅ SEND GASLESS TRANSACTION
  const sendGaslessTransaction = useCallback(async (tx: TransactionRequest): Promise<TransactionResponse | null> => {
    if (!smartAccount) {
      throw new Error('Smart account not initialized');
    }

    console.log('⚡ SENDING GASLESS TRANSACTION');
    console.log('   ✅ No MetaMask popup');
    console.log('   ✅ Paid by DApp');
    console.log('   ⏱️  Target: < 15 seconds');

    const startTime = Date.now();

    try {
      const result = await smartAccount.sendTransaction(tx);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`✅ Gasless transaction completed in ${duration}s`);
      console.log('   Hash:', result.hash);
      console.log('   UserOp:', result.userOpHash);

      // ✅ VERIFY < 15 SECOND REQUIREMENT
      if (duration < 15) {
        console.log('✅ SPEED REQUIREMENT MET: < 15 seconds');
      } else {
        console.warn('⚠️  SPEED REQUIREMENT NOT MET: >= 15 seconds');
      }

      return result;

    } catch (error: any) {
      console.error('❌ Gasless transaction failed:', error);
      throw error;
    }
  }, [smartAccount]);

  // ✅ VERIFY PAYMASTER FUNDING
  const verifyPaymasterFunding = useCallback(async (): Promise<boolean> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏠 LOCAL DEVELOPMENT - Mock paymaster always funded');
      return true;
    }

    try {
      // In production, check actual paymaster balance
      // const paymasterBalance = await checkPaymasterBalance();
      // return paymasterBalance > minimumThreshold;
      
      return true; // Mock for now
    } catch (error) {
      console.error('❌ Paymaster verification failed:', error);
      return false;
    }
  }, []);

  return {
    smartAccount,
    isLoading,
    error,
    initializeSmartAccount,
    sendGaslessTransaction,
    verifyPaymasterFunding,
  };
}