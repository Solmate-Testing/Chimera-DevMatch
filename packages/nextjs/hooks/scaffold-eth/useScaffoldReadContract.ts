import { useReadContract } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { AbiFunctionReturnType, ContractAbi, ContractName, UseScaffoldReadConfig } from "~~/utils/scaffold-eth/contract";

/**
 * Wrapper around wagmi's useReadContract hook which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 */
export const useScaffoldReadContract = <
  TContractName extends ContractName,
  TFunctionName extends keyof ContractAbi<TContractName>,
>({
  contractName,
  functionName,
  args,
  ...readConfig
}: UseScaffoldReadConfig<TContractName, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  return useReadContract({
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    functionName,
    args,
    ...readConfig,
  }) as {
    data: AbiFunctionReturnType<ContractAbi<TContractName>, TFunctionName> | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
};