"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deriveStatus } from "@/lib/status";
import { filterCampaigns } from "@/lib/filter-campaigns";
import { sortCampaignsByRecency } from "@/lib/sort-campaigns";
import { buildClaimLink } from "@/lib/claim-link";

type Campaign = {
  campaignId: string;
  name: string;
  description: string;
  imageUrl: string;
  maxSupply: number;
  mintedCount: number;
  startTime: number;
  endTime: number;
  soulbound: boolean;
  creator: string;
  createdAt: number;
};

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  upcoming: "secondary",
  ended: "outline",
  sold_out: "destructive",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function DiscoveryGrid({
  campaigns,
  className,
}: {
  campaigns: Campaign[];
  className?: string;
}) {
  const [query, setQuery] = useState("");

  const debouncedQuery = useDebounce(query, 200);
  const now = Date.now();

  const processed = useMemo(() => {
    const filtered = filterCampaigns(campaigns, debouncedQuery);
    return sortCampaignsByRecency(filtered).map((c) => ({
      ...c,
      status: deriveStatus(c, now),
    }));
  }, [campaigns, debouncedQuery, now]);

  const isEmpty = campaigns.length === 0;
  const noResults = !isEmpty && processed.length === 0;

  return (
    <div className={cn("space-y-6", className)}>
      {!isEmpty && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="mb-4 size-16 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-medium">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for new badge campaigns
          </p>
        </div>
      )}

      {noResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 size-16 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-medium">No campaigns match</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term
          </p>
        </div>
      )}

      {processed.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processed.map((campaign) => (
            <Card key={campaign.campaignId} className="flex flex-col">
              <div className="aspect-video overflow-hidden">
                {campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted">
                    <Clock className="size-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-medium">{campaign.name}</h3>
                  <Badge variant={statusColors[campaign.status] ?? "outline"}>
                    {campaign.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {campaign.description}
                </p>
                <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="truncate" title={campaign.creator}>
                    by {campaign.creator.slice(0, 6)}...
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {campaign.mintedCount}/{campaign.maxSupply}
                  </span>
                </div>
                <Link
                  href={buildClaimLink(campaign.campaignId)}
                  className={cn(buttonVariants({ size: "sm" }), "mt-1 w-full")}
                >
                  Claim
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
