import { Chain } from "viem";
import { hardhat, mainnet, sepolia } from "viem/chains";

// Define Oasis Sapphire chains
export const sapphireTestnet = {
  id: 0x5aff, // 23295
  name: "Oasis Sapphire Testnet",
  network: "sapphire-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "TEST",
    symbol: "TEST",
  },
  rpcUrls: {
    public: { http: ["https://testnet.sapphire.oasis.dev"] },
    default: { http: ["https://testnet.sapphire.oasis.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Oasis Sapphire Testnet Explorer",
      url: "https://testnet.explorer.sapphire.oasis.dev",
    },
  },
  testnet: true,
} as const satisfies Chain;

export const sapphireMainnet = {
  id: 0x5afe, // 23294  
  name: "Oasis Sapphire",
  network: "sapphire",
  nativeCurrency: {
    decimals: 18,
    name: "ROSE",
    symbol: "ROSE",
  },
  rpcUrls: {
    public: { http: ["https://sapphire.oasis.dev"] },
    default: { http: ["https://sapphire.oasis.dev"] },
  },
  blockExplorers: {
    default: {
      name: "Oasis Sapphire Explorer", 
      url: "https://explorer.sapphire.oasis.dev",
    },
  },
} as const satisfies Chain;

export type ScaffoldConfig = {
  targetNetworks: readonly Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [
    hardhat,
    sepolia,
    sapphireTestnet,
    mainnet,
  ],

  // The interval at which your front-end polls the RPC servers for new data
  // it has no effect if you only target the local network (default is 4000)
  pollingInterval: 30000,

  // This is ours Alchemy API key (you can get yours on https://dashboard.alchemyapi.io)
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",

  // This is our WalletConnect project ID (you can get yours on https://cloud.walletconnect.com)
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Only show the Burner Wallet when running on hardhat network
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;