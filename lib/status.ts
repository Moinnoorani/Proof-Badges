export type CampaignStatus = "upcoming" | "active" | "ended" | "sold_out";

export function deriveStatus(
  c: { startTime: number; endTime: number; maxSupply: number; mintedCount: number },
  now: number
): CampaignStatus {
  if (c.mintedCount >= c.maxSupply) return "sold_out";
  if (now < c.startTime) return "upcoming";
  if (now >= c.endTime) return "ended";
  return "active";
}
