import { useState } from "react";
import { useWriteContract } from "wagmi";
import { useDeployedContractInfo } from "./useDeployedContractInfo";
import { useTransactor } from "./useTransactor";
import { ContractAbi, ContractName, UseScaffoldWriteConfig } from "~~/utils/scaffold-eth/contract";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Wrapper around wagmi's useWriteContract hook which automatically loads (by name) the contract ABI and address from
 * the contracts present in deployedContracts.ts & externalContracts.ts corresponding to targetNetworks configured in scaffold.config.ts
 */
export const useScaffoldWriteContract = <
  TContractName extends ContractName,
  TFunctionName extends keyof ContractAbi<TContractName>,
>({
  contractName,
  functionName,
  args,
  value,
  onBlockConfirmation,
  blockConfirmations,
  ...writeConfig
}: UseScaffoldWriteConfig<TContractName, TFunctionName>) => {
  const { data: deployedContract } = useDeployedContractInfo(contractName);
  const wagmiContractWrite = useWriteContract();
  const writeTx = useTransactor();
  const [isMining, setIsMining] = useState(false);

  const sendContractWriteTx = async ({
    args: newArgs,
    value: newValue,
    ...otherConfig
  }: {
    args?: UseScaffoldWriteConfig<TContractName, TFunctionName>["args"];
    value?: UseScaffoldWriteConfig<TContractName, TFunctionName>["value"];
  } & Parameters<ReturnType<typeof useWriteContract>["writeContract"]>[0] = {}) => {
    if (!deployedContract) {
      notification.error("Target contract is not deployed");
      return;
    }

    if (!writeTx) {
      notification.error("Transactor not available");
      return;
    }

    try {
      setIsMining(true);
      
      const writeContractParameters = {
        address: deployedContract.address,
        abi: deployedContract.abi,
        functionName,
        args: newArgs ?? args,
        value: newValue ?? value,
        ...otherConfig,
      } as any;

      const result = await writeTx(
        () => wagmiContractWrite.writeContractAsync(writeContractParameters),
        { onBlockConfirmation, blockConfirmations },
      );

      return result;
    } catch (e: any) {
      throw e;
    } finally {
      setIsMining(false);
    }
  };

  return {
    ...wagmiContractWrite,
    isMining,
    writeContractAsync: sendContractWriteTx,
  };
};