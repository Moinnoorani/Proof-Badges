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
 * Returns true iff the campaign is active, the wallet has not already claimed,
 * and the wallet balance covers the UGF quote.
 */
export function canClaim({
  status,
  alreadyClaimed,
  balance,
  quote,
}: CanClaimParams): boolean {
  return status === "active" && !alreadyClaimed && balance >= quote;
}

/**
 * Returns true iff the wallet balance is less than the UGF quote.
 * Independent from canClaim — the faucet CTA should show even when
 * the claim is also blocked by another reason.
 */
export function showFaucet({ balance, quote }: ShowFaucetParams): boolean {
  return balance < quote;
}
