import { useTargetNetwork } from "./useTargetNetwork";

const DEFAULT_NETWORK_COLOR: [string, string] = ["#666666", "#bbbbbb"];

export function getNetworkColor(networkId?: number, isDarkMode?: boolean): string {
  const colorIndex = isDarkMode ? 1 : 0;

  switch (networkId) {
    case 1:
      return ["#627EEA", "#627EEA"][colorIndex]; // Ethereum Mainnet
    case 11155111:
      return ["#7003DD", "#7003DD"][colorIndex]; // Sepolia
    case 137:
      return ["#8247E5", "#8247E5"][colorIndex]; // Polygon
    case 10:
      return ["#f01a37", "#f01a37"][colorIndex]; // Optimism
    case 42161:
      return ["#28a0f0", "#28a0f0"][colorIndex]; // Arbitrum
    case 8453:
      return ["#0052ff", "#0052ff"][colorIndex]; // Base
    case 31337:
      return ["#b8af0c", "#b8af0c"][colorIndex]; // Hardhat
    case 23294:
      return ["#3B82F6", "#1D4ED8"][colorIndex]; // Oasis Sapphire Mainnet
    case 23295:
      return ["#06B6D4", "#0891B2"][colorIndex]; // Oasis Sapphire Testnet
    default:
      return DEFAULT_NETWORK_COLOR[colorIndex];
  }
}

/**
 * Gets the color of the target network
 */
export const useNetworkColor = (networkId?: number, isDarkMode?: boolean) => {
  const { targetNetwork } = useTargetNetwork();
  const networkColor = getNetworkColor(networkId ?? targetNetwork.id, isDarkMode);

  return networkColor;
};