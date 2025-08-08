import { useEffect, useState } from "react";
import { Abi, Address } from "viem";
import { usePublicClient } from "wagmi";
import { Contract, ContractName } from "~~/utils/scaffold-eth/contract";
import { useDeployedContractInfo } from "./useDeployedContractInfo";

/**
 * Gets a deployed contract by contract name and returns a contract instance
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.walletClient - A wallet client instance from `useWalletClient`
 */
export const useScaffoldContract = <
  TContractName extends ContractName,
  TWalletClient extends Parameters<typeof getContract>[0]["walletClient"],
>({
  contractName,
  walletClient,
}: {
  contractName: TContractName;
  walletClient?: TWalletClient | null;
}) => {
  const { data: deployedContractData, isLoading: deployedContractLoading } =
    useDeployedContractInfo(contractName);
  const publicClient = usePublicClient();
  const [contract, setContract] = useState<Contract<TContractName, TWalletClient>>();

  useEffect(() => {
    if (!deployedContractData) {
      setContract(undefined);
      return;
    }

    if (!publicClient) {
      console.error("❌ PublicClient not found");
      return;
    }

    const contractInstance = getContract({
      address: deployedContractData.address,
      abi: deployedContractData.abi,
      walletClient: walletClient,
      publicClient,
    });

    setContract(contractInstance as Contract<TContractName, TWalletClient>);
  }, [publicClient, walletClient, deployedContractData]);

  return {
    data: contract,
    isLoading: deployedContractLoading,
  };
};

// Simplified getContract function for our use case
function getContract({
  address,
  abi,
  walletClient,
  publicClient,
}: {
  address: Address;
  abi: Abi;
  walletClient?: any;
  publicClient: any;
}) {
  return {
    address,
    abi,
    walletClient,
    publicClient,
    read: async (functionName: string, args?: any[]) => {
      return publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });
    },
    write: async (functionName: string, args?: any[]) => {
      if (!walletClient) throw new Error("Wallet client required for write operations");
      
      const { request } = await publicClient.simulateContract({
        address,
        abi,
        functionName,
        args,
        account: walletClient.account,
      });
      
      return walletClient.writeContract(request);
    },
    watchEvent: (eventName: string, options?: any) => {
      return publicClient.watchContractEvent({
        address,
        abi,
        eventName,
        ...options,
      });
    },
  };
}