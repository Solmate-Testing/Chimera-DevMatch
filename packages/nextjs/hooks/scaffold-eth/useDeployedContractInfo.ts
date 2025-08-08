import { useQuery } from "@tanstack/react-query";
import { useTargetNetwork } from "./useTargetNetwork";
import { Contract, ContractName, contracts } from "~~/utils/scaffold-eth/contract";

/**
 * Gets the deployed contract info for a given contract name from the contracts file
 */
export const useDeployedContractInfo = <TContractName extends ContractName>(
  contractName: TContractName,
) => {
  const { targetNetwork } = useTargetNetwork();

  return useQuery({
    queryKey: ["deployedContractInfo", contractName, targetNetwork.id],
    queryFn: async (): Promise<Contract<TContractName> | null> => {
      const contractsData = contracts as any;
      const chainId = targetNetwork.id;
      
      if (!contractsData || !contractsData[chainId] || !contractsData[chainId][contractName]) {
        return null;
      }

      const deployedContract = contractsData[chainId][contractName];
      
      return {
        address: deployedContract.address,
        abi: deployedContract.abi,
      } as Contract<TContractName>;
    },
    enabled: !!contractName && !!targetNetwork,
    retry: false,
    staleTime: Infinity,
  });
};