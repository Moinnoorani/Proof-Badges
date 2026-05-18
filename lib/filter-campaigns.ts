export type FilterableCampaign = {
  createdAt: number;
  name: string;
  creator: string;
  [key: string]: unknown;
};

/**
 * Filters campaigns by case-insensitive substring match against `name` and `creator`.
 * If `q` is empty, returns the list unchanged.
 */
export function filterCampaigns<T extends FilterableCampaign>(
  list: T[],
  q: string
): T[] {
  if (q === "") return list;
  const lower = q.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.creator.toLowerCase().includes(lower)
  );
}
