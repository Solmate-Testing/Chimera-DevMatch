import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { useTargetNetwork } from "./useTargetNetwork";

/**
 * Get the current gas price for the target network
 */
export const useGasPrice = () => {
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["gasPrice", targetNetwork.id],
    queryFn: async () => {
      if (!publicClient) {
        throw new Error("Public client not available");
      }

      const gasPrice = await publicClient.getGasPrice();
      return gasPrice;
    },
    enabled: Boolean(publicClient),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};