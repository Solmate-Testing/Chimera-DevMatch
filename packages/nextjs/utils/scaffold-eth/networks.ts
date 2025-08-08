import { Chain } from "viem";
import { hardhat, mainnet, sepolia } from "viem/chains";

export type ChainWithAttributes = Chain & {
  color?: string;
  faucetUrl?: string;
};

// Supported networks for Chimera DevMatch
export const networks: ChainWithAttributes[] = [
  {
    ...hardhat,
    color: "#b83280",
    faucetUrl: "http://localhost:8545",
  },
  {
    ...mainnet,
    color: "#ff8b9a",
    faucetUrl: "",
  },
  {
    ...sepolia,
    color: "#5f4bb6",
    faucetUrl: "https://sepoliafaucet.com/",
  },
];

// Default network for development
export const defaultNetwork = hardhat;

// Get network by chainId
export const getNetworkById = (chainId: number): ChainWithAttributes | undefined => {
  return networks.find(network => network.id === chainId);
};

// Get target network from environment or default
export const getTargetNetwork = (): ChainWithAttributes => {
  const targetNetworkId = process.env.NEXT_PUBLIC_TARGET_NETWORK_ID;
  
  if (targetNetworkId) {
    const targetNetwork = getNetworkById(parseInt(targetNetworkId));
    if (targetNetwork) {
      return targetNetwork;
    }
  }
  
  return defaultNetwork;
};