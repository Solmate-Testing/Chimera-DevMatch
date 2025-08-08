import { useEffect } from "react";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { ContractAbi, ContractName } from "~/utils/scaffold-eth/contract";

/**
 * Subscribe to events from a deployed contract
 */
export const useScaffoldEventSubscriber = <
  TContractName extends ContractName,
  TEventName extends string,
>({
  contractName,
  eventName,
  listener,
}: {
  contractName: TContractName;
  eventName: TEventName;
  listener: (logs: any[]) => void;
}) => {
  const publicClient = usePublicClient();
  const { data: deployedContract } = useDeployedContractInfo(contractName);

  useEffect(() => {
    if (!publicClient || !deployedContract || !listener) return;

    const unwatch = publicClient.watchContractEvent({
      address: deployedContract.address,
      abi: deployedContract.abi as ContractAbi<TContractName>,
      eventName,
      onLogs: listener,
    });

    return unwatch;
  }, [publicClient, deployedContract, eventName, listener]);
};