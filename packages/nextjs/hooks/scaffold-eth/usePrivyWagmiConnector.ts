import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createWalletClient, http } from "viem";
import { polygonMumbai } from "viem/chains";

export const usePrivyWagmiConnector = () => {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initSmartAccount = async () => {
      if (!ready || !authenticated || !wallets.length) return;

      setIsLoading(true);
      try {
        const embeddedWallet = wallets.find(wallet => wallet.walletClientType === "privy");
        if (!embeddedWallet) return;

        await embeddedWallet.switchChain(polygonMumbai.id);
        const provider = await embeddedWallet.getEthereumProvider();
        
        const walletClient = createWalletClient({
          account: embeddedWallet.address as `0x${string}`,
          chain: polygonMumbai,
          transport: http(),
        });

        const smartAccountClient = await createSmartAccountClient({
          signer: walletClient,
          bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL!,
          biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY!,
        });

        setSmartAccount(smartAccountClient);
      } catch (error) {
        console.error("Failed to initialize smart account:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSmartAccount();
  }, [ready, authenticated, wallets]);

  return {
    smartAccount,
    isLoading,
    isConnected: !!smartAccount,
    address: smartAccount?.accountAddress,
  };
};