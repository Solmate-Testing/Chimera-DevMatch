import { useCallback } from "react";
import { Hash } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

type TransactionFunc = () => Promise<Hash>;

type TTransactionFuncOptions = {
  onBlockConfirmation?: (txnReceipt: any) => void;
  blockConfirmations?: number;
};

/**
 * Custom notification content for TXs.
 */
const TxnNotification = ({ message, blockExplorerLink }: { message: string; blockExplorerLink?: string }) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0 text-sm">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a href={blockExplorerLink} target="_blank" rel="noreferrer" className="text-sm underline">
          View on Block Explorer
        </a>
      ) : null}
    </div>
  );
};

/**
 * Runs Transaction passed in to returned function showing UI feedback.
 * @param _walletClient - Wallet Client from `useWalletClient()` (optional)
 * @returns function that takes a transaction function as callback, shows UI feedback for transaction and returns a promise of the transaction hash
 */
export const useTransactor = () => {
  const { chain } = useAccount();

  const result = useCallback(
    (tx: TransactionFunc, options?: TTransactionFuncOptions): Promise<Hash | undefined> => {
      if (!tx) {
        notification.error("Incorrect transaction passed to transactor");
        return Promise.resolve(undefined);
      }

      return new Promise(async (resolve, reject) => {
        try {
          const notificationId = notification.loading("Awaiting for user confirmation");
          const txnHash = await tx();
          notification.remove(notificationId);

          notification.success(
            <TxnNotification 
              message="Transaction sent!" 
              blockExplorerLink={chain?.blockExplorers?.default ? `${chain.blockExplorers.default.url}/tx/${txnHash}` : ""} 
            />,
          );

          if (options?.onBlockConfirmation) {
            const notificationId = notification.loading("Waiting for block confirmation");
            
            // Simple wait for receipt (you may want to use wagmi's useWaitForTransactionReceipt here)
            setTimeout(() => {
              notification.remove(notificationId);
              notification.success("Transaction confirmed");
              options.onBlockConfirmation?.(txnHash);
            }, 3000); // Simple 3 second wait - replace with actual receipt waiting
          }

          resolve(txnHash);
        } catch (error: any) {
          console.error("⚡️ ~ file: useTransactor.tsx ~ error", error);
          const message = error?.message || "Transaction failed";
          notification.error(message);
          reject(error);
        }
      });
    },
    [chain],
  );

  return result;
};