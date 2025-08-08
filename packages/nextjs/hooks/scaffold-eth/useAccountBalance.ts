import { useBalance } from "wagmi";
import { useTargetNetwork } from "./useTargetNetwork";

/**
 * Wrapper around wagmi's useBalance hook. Retrieves the balance of an address on the targetNetwork.
 */
export const useAccountBalance = (address?: string) => {
  const { targetNetwork } = useTargetNetwork();

  const {
    data: fetchedBalanceData,
    isError,
    isLoading,
    ...rest
  } = useBalance({
    address: address as `0x${string}`,
    chainId: targetNetwork.id,
    query: {
      enabled: Boolean(address),
    },
  });

  return {
    balance: fetchedBalanceData,
    isError,
    isLoading,
    ...rest,
  };
};