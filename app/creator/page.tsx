"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { CampaignCard, type CampaignCardData } from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sortCampaignsByRecency } from "@/lib/sort-campaigns";
import { NetworkGuard } from "@/components/network-guard";

function CreatorDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const newCampaignId = searchParams.get("new");

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json() as CampaignCardData[];
      setCampaigns(data);
    } catch (err) {
      console.error("[CreatorDashboard] Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (newCampaignId) {
      const timer = setTimeout(() => {
        router.replace("/creator");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newCampaignId, router]);

  const myCampaigns = campaigns.filter(
    (c) => c.creator.toLowerCase() === address?.toLowerCase(),
  );

  const sortedCampaigns = sortCampaignsByRecency(myCampaigns);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <ExternalLink className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Connect your wallet to view and manage your badge campaigns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your badge campaigns
          </p>
        </div>
        <Link href="/creator/new">
          <Button>
            <Plus className="size-4" />
            Create New Campaign
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && sortedCampaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">No campaigns yet</p>
          <Link href="/creator/new">
            <Button variant="outline">
              <Plus className="size-4" />
              Create Your First Campaign
            </Button>
          </Link>
        </div>
      )}

      {!loading && sortedCampaigns.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCampaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              management
              highlighted={c.id === newCampaignId}
            />
          ))}
        </div>
      )}

      {newCampaignId && (
        <div className="rounded-lg bg-primary/10 p-4 text-center text-sm text-primary">
          Campaign created successfully!
        </div>
      )}
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <NetworkGuard>
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-video w-full rounded-lg" />)}</div></div>}>
            <CreatorDashboardContent />
          </Suspense>
        </div>
      </div>
    </NetworkGuard>
  );
}
