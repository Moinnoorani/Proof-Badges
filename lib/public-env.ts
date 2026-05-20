/**
 * Public environment variables (NEXT_PUBLIC_*).
 * Safe to import in both client and server code.
 */

export const BADGE_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_BADGE_CONTRACT ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const MOCK_USD_ADDRESS = (process.env.NEXT_PUBLIC_MOCK_USD ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export const BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org";

export const BASESCAN_TX_URL =
  process.env.NEXT_PUBLIC_BASESCAN_TX_URL ?? "https://sepolia.basescan.org/tx/";
