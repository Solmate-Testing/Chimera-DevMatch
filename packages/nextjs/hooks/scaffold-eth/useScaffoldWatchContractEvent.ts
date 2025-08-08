import { useWatchContractEvent } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { ContractAbi, ContractName } from "~/utils/scaffold-eth/contract";

/**
 * Watch for contract events using wagmi's useWatchContractEvent
 */
export const useScaffoldWatchContractEvent = <
  TContractName extends ContractName,
  TEventName extends keyof ContractAbi<TContractName>,
>({
  contractName,
  eventName,
  onLogs,
  ...watchContractEventConfig
}: {
  contractName: TContractName;
  eventName: TEventName;
  onLogs: (logs: any[]) => void;
} & Omit<Parameters<typeof useWatchContractEvent>[0], "address" | "abi" | "eventName" | "onLogs">) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  return useWatchContractEvent({
    address: deployedContract?.address,
    abi: deployedContract?.abi,
    eventName: eventName as string,
    onLogs,
    ...watchContractEventConfig,
  } as any);
};