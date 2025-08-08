import { Abi, Address } from "viem";
import { UseReadContractParameters, UseWriteContractParameters } from "wagmi";
// Import your generated contracts
import deployedContracts from "./contractsData";

// Contract names from your deployed contracts
export type ContractName = keyof typeof deployedContracts[keyof typeof deployedContracts];

// Get contract ABI type
export type ContractAbi<TContractName extends ContractName> = 
  (typeof deployedContracts)[keyof typeof deployedContracts][TContractName]["abi"];

// Contract instance type
export type Contract<TContractName extends ContractName, TWalletClient = any> = {
  address: Address;
  abi: ContractAbi<TContractName>;
  read?: any;
  write?: any;
  watchEvent?: any;
};

// Get function return type from ABI
export type AbiFunctionReturnType<TAbi extends Abi, TFunctionName extends string> = any;

// Read contract config
export type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends keyof ContractAbi<TContractName>
> = {
  contractName: TContractName;
  functionName: TFunctionName;
  args?: any[];
} & Omit<UseReadContractParameters, "address" | "abi" | "functionName" | "args">;

// Write contract config  
export type UseScaffoldWriteConfig<
  TContractName extends ContractName,
  TFunctionName extends keyof ContractAbi<TContractName>
> = {
  contractName: TContractName;
  functionName: TFunctionName;
  args?: any[];
  value?: bigint;
  onBlockConfirmation?: (txnReceipt: any) => void;
  blockConfirmations?: number;
} & Omit<UseWriteContractParameters, "address" | "abi" | "functionName" | "args">;

// Export deployed contracts for hooks
export const contracts = deployedContracts;

// Generic contracts declaration type
export type GenericContractsDeclaration = {
  [key: number]: {
    [key: string]: {
      address: `0x${string}`;
      abi: readonly any[];
    };
  };
};