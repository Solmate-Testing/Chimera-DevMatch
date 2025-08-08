import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { ContractAbi, ContractName } from "~/utils/scaffold-eth/contract";

/**
 * Fetch event history for a deployed contract
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends string,
>({
  contractName,
  eventName,
  fromBlock,
  blockData = false,
  transactionData = false,
  receiptData = false,
  watch = false,
}: {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock?: bigint;
  blockData?: boolean;
  transactionData?: boolean;
  receiptData?: boolean;
  watch?: boolean;
}) => {
  const publicClient = usePublicClient();
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  const queryKey = [
    "scaffoldEventHistory",
    contractName,
    eventName,
    fromBlock,
    blockData,
    transactionData, 
    receiptData,
  ] as const;

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!publicClient || !deployedContract) {
        throw new Error("Public client or contract not available");
      }

      const logs = await publicClient.getContractEvents({
        address: deployedContract.address,
        abi: deployedContract.abi as ContractAbi<TContractName>,
        eventName,
        fromBlock: fromBlock ?? 0n,
      });

      return logs.map((log: any) => ({
        ...log,
        args: log.args,
        eventName,
      }));
    },
    enabled: Boolean(publicClient && deployedContract),
    refetchInterval: watch ? 5000 : false,
  });
};