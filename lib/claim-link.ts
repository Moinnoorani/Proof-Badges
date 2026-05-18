/**
 * Claim link helpers for building and parsing `/claim/{campaignId}` URLs.
 * Validates: Requirements 8.1
 */

const CLAIM_PREFIX = "/claim/";

/**
 * Builds a claim link path for a given campaign ID.
 * @param campaignId - The campaign identifier (decimal string of uint256)
 * @returns The claim link path, e.g. `/claim/42`
 */
export function buildClaimLink(campaignId: string): string {
  return `${CLAIM_PREFIX}${campaignId}`;
}

/**
 * Parses a claim link path and extracts the campaign ID.
 * @param path - The URL path to parse, e.g. `/claim/42`
 * @returns The campaign ID string if the path matches, or null otherwise
 */
export function parseClaimLink(path: string): string | null {
  if (!path.startsWith(CLAIM_PREFIX)) {
    return null;
  }

  const campaignId = path.slice(CLAIM_PREFIX.length);

  // Must have a non-empty campaignId with no additional path segments
  if (!campaignId || campaignId.includes("/")) {
    return null;
  }

  return campaignId;
}
