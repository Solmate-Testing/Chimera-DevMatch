import { useAccount, useChainId } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes } from "~~/utils/scaffold-eth";

/**
 * Retrieves the connected wallet's network from wagmi and falls back to the default network from scaffold.config.ts.
 * @returns Object with targetNetwork, targetNetwork's chain ID, and isLocalNetwork boolean
 */
export const useTargetNetwork = (): {
  targetNetwork: ChainWithAttributes;
  targetNetworkId: number;
  isLocalNetwork: boolean;
} => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
  const targetNetwork = isConnected && chainId 
    ? scaffoldConfig.targetNetworks.find(network => network.id === chainId) || scaffoldConfig.targetNetworks[0]
    : scaffoldConfig.targetNetworks[0];

  return {
    targetNetwork,
    targetNetworkId: targetNetwork.id,
    isLocalNetwork: targetNetwork.id === 31337,
  };
};