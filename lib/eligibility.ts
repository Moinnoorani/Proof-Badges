import type { CampaignStatus } from "./status";

export interface CanClaimParams {
  status: CampaignStatus;
  alreadyClaimed: boolean;
  balance: bigint;
  quote: bigint;
}

export interface ShowFaucetParams {
  balance: bigint;
  quote: bigint;
}

/**
 * Returns true iff the campaign is active and the wallet has not already claimed.
 * UGF quote check is removed — transactions are sent directly via MetaMask.
 */
export function canClaim({
  status,
  alreadyClaimed,
}: CanClaimParams): boolean {
  return status === "active" && !alreadyClaimed;
}

/**
 * Always returns false — UGF is bypassed, MetaMask handles gas natively.
 */
export function showFaucet(_params: ShowFaucetParams): boolean {
  return false;
}
