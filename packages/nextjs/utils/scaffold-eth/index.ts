// Common utilities for Scaffold-ETH
export * from "./contract";
export * from "./notification";
export * from "./networks";

// Common types
import { Chain } from "viem";

export type ChainWithAttributes = Chain & {
  color?: string;
  faucetUrl?: string;
};