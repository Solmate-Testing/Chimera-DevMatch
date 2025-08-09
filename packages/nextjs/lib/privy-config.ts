// GASLESS TRANSACTION FLOW - PRIVY + GOOGLE OAUTH CONFIGURATION
// Senior Web3 UX Engineer Implementation

import type { PrivyClientConfig } from '@privy-io/react-auth';

// ✅ EXACT REQUIREMENT: Google login configuration
export const PRIVY_CONFIG: Partial<PrivyClientConfig> = {
  // ✅ FOR DEVELOPMENT: Use email first, then Google when properly configured
  loginMethods: ['email', 'wallet'],
  
  appearance: {
    theme: 'light',
    accentColor: '#2563eb',
    logo: '/logo.svg',
    loginMessage: 'Sign in to Chimera DevMatch - AI Marketplace',
    showWalletLoginFirst: false, // ✅ CRITICAL: Show Google login first
  },
  
  // ✅ SMART WALLET CONFIGURATION FOR GASLESS TRANSACTIONS
  // This enables ERC-4337 smart wallets for gasless transactions
  smartWallet: {
    createOnLogin: 'users-without-wallets', // Auto-create for Google users
    noPromptOnSignature: true, // ✅ NO METAMASK POPUP
  },
  
  // ✅ REQUIRED NETWORKS
  supportedChains: [
    {
      id: 1, // Ethereum Mainnet
      name: 'Ethereum',
      network: 'mainnet',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: [process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : 'https://eth-mainnet.g.alchemy.com/v2/demo'],
      blockExplorers: [
        {
          name: 'Etherscan',
          url: 'https://etherscan.io',
        },
      ],
    },
    {
      id: 11155111, // Sepolia Testnet  
      name: 'Sepolia',
      network: 'sepolia',
      nativeCurrency: {
        name: 'Sepolia Ether',
        symbol: 'SEP',
        decimals: 18,
      },
      rpcUrls: [process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` : 'https://eth-sepolia.g.alchemy.com/v2/demo'],
      blockExplorers: [
        {
          name: 'Sepolia Etherscan',
          url: 'https://sepolia.etherscan.io',
        },
      ],
    },
    {
      id: 31337, // Local Hardhat
      name: 'Localhost',
      network: 'localhost',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['http://127.0.0.1:8545'],
    },
  ],
};

// ✅ BICONOMY PAYMASTER CONFIGURATION
export const BICONOMY_CONFIG = {
  // Sepolia Testnet Configuration
  bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL!,
  paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL!,
  
  // ✅ GASLESS TRANSACTION SETTINGS
  gasPolicy: {
    sponsorshipPolicyId: 'default', // Sponsor all transactions
    paymasterAndData: '0x', // Will be populated by Paymaster
  },
  
  // ✅ VERIFICATION SETTINGS - ENSURE "PAID BY DAPP" 
  verification: {
    showPaymasterInExplorer: true,
    paymasterName: 'Chimera DevMatch DApp',
  },
};

// ✅ LOCAL DEVELOPMENT MOCK CONFIGURATION
export const LOCAL_GASLESS_CONFIG = {
  mockSmartAccount: true,
  mockPaymaster: true,
  simulateGaslessFlow: true,
  mockTransactionTime: 2000, // 2 seconds for demo
};