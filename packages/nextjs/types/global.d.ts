// Global type definitions for Chimera-DevMatch

declare global {
  interface Window {
    ethereum?: any;
    biconomy?: any;
  }

  namespace NodeJS {
    interface ProcessEnv {
      // Privy Configuration
      NEXT_PUBLIC_PRIVY_APP_ID: string;
      PRIVY_APP_SECRET: string;

      // Network Configuration
      NEXT_PUBLIC_ALCHEMY_API_KEY: string;
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string;
      NEXT_PUBLIC_TARGET_NETWORK: string;

      // Biconomy (Gasless Transactions)
      NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY: string;
      NEXT_PUBLIC_BICONOMY_BUNDLER_URL: string;

      // Web3.Storage (IPFS)
      WEB3_STORAGE_TOKEN: string;

      // The Graph (Subgraph)
      NEXT_PUBLIC_SUBGRAPH_URL: string;
      GRAPH_API_KEY: string;

      // Chainlink Functions
      CHAINLINK_SUBSCRIPTION_ID: string;
      CHAINLINK_DON_ID: string;

      // Oasis Sapphire
      OASIS_SAPPHIRE_RPC: string;
      OASIS_DEPLOYER_PRIVATE_KEY: string;

      // Development
      NEXT_PUBLIC_IGNORE_BUILD_ERROR?: string;
      DEBUG?: string;
    }
  }
}

// Scaffold-ETH types
export interface ScaffoldConfig {
  targetNetworks: Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
}

// Privy types
export interface PrivyUser {
  id: string;
  createdAt: Date;
  linkedAccounts: Array<{
    type: string;
    address?: string;
    email?: string;
  }>;
}

// Biconomy types
export interface SmartAccountConfig {
  signer: any;
  chainId: number;
  rpcUrl: string;
  paymasterApiKey?: string;
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

// Web3.Storage types
export interface IPFSUploadResult {
  cid: string;
  url: string;
}

// Marketplace types
export interface Product {
  id: number;
  creator: string;
  name: string;
  description: string;
  price: string;
  category: string;
  active: boolean;
  createdAt: number;
  apiKeyHash: string;
  totalStaked: string;
  loves: number;
}

export interface StakeEvent {
  productId: number;
  user: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
}

export interface ProductListedEvent {
  id: number;
  creator: string;
  name: string;
  price: string;
  category: string;
  blockNumber: number;
  transactionHash: string;
}

// Chainlink Functions types
export interface ChainlinkRequest {
  requestId: string;
  productId: number;
  user: string;
  input: string;
  status: 'pending' | 'fulfilled' | 'failed';
  result?: string;
  error?: string;
}

// Oasis Sapphire types
export interface ROFLStorage {
  get: (key: string) => Promise<Uint8Array>;
  set: (key: string, value: Uint8Array) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

// Chain types
export interface ChainWithAttributes extends Chain {
  color?: string;
  faucetUrl?: string;
}

export {};