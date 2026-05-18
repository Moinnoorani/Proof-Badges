export type CampaignWithTimestamp = {
  createdAt: number;
  name: string;
  creator: string;
  [key: string]: unknown;
};

/**
 * Returns a new array of campaigns sorted by createdAt descending (most recent first).
 * Does not mutate the input.
 */
export function sortCampaignsByRecency<T extends CampaignWithTimestamp>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}
