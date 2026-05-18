/**
 * Badge type representing an on-chain badge token.
 */
export type Badge = {
  campaignId: string;
  tokenId: string;
  imageUrl?: string;
  name?: string;
  mintTimestamp?: number;
  soulbound?: boolean;
};

/**
 * Groups a list of badges by their campaignId.
 *
 * Each badge appears in exactly one group keyed by its own campaignId.
 * The union of all group values equals the input list (as a multiset).
 * No group is empty.
 */
export function groupBadgesByCampaign(
  badges: Badge[]
): Record<string, Badge[]> {
  const groups: Record<string, Badge[]> = {};

  for (const badge of badges) {
    const key = badge.campaignId;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(badge);
  }

  return groups;
}
