import { useEffect } from "react";
import { useAccountBalance } from "./useAccountBalance";
import { useAnimationConfig } from "./useAnimationConfig";

/**
 * Custom hook that watches for balance changes and triggers animations
 */
export const useWatchBalance = (address?: string) => {
  const { setShowAnimation, setIsLoadingBalance } = useAnimationConfig();
  const { balance, isLoading } = useAccountBalance(address);

  useEffect(() => {
    setIsLoadingBalance(isLoading);
  }, [isLoading, setIsLoadingBalance]);

  useEffect(() => {
    if (balance) {
      setShowAnimation(true);
      const timeout = setTimeout(() => setShowAnimation(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [balance, setShowAnimation]);

  return {
    balance,
    isLoading,
  };
};