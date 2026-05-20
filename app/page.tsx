import { AlertCircle } from "lucide-react";
import { DiscoveryGrid } from "@/components/discovery-grid";

async function getCampaigns() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT ?? 3000}`);
    const res = await fetch(`${base}/api/campaigns`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Failed to fetch campaigns: ${res.status}`);
    return (await res.json()) as unknown[];
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const campaigns = await getCampaigns();

  if (campaigns === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="mb-4 size-16 text-destructive/60" />
        <h3 className="mb-2 text-lg font-medium">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">
          Could not load campaigns. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Discover Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Find and claim gasless badges from campaigns
        </p>
      </div>
      <DiscoveryGrid campaigns={campaigns as any[]} />
    </div>
  );
}
