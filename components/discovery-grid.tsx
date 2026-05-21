"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Users, ImageOff, Sparkles, Lock, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TiltCard } from "@/components/tilt-card";
import { cn } from "@/lib/utils";
import { deriveStatus, type CampaignStatus } from "@/lib/status";
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

const statusVariantMap: Record<
  CampaignStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  active: "default",
  upcoming: "secondary",
  ended: "outline",
  sold_out: "destructive",
};

const statusPillClass: Record<CampaignStatus, string> = {
  active:
    "border border-cyan/30 bg-gradient-to-r from-cyan/20 via-emerald-400/10 to-cyan/20 text-cyan shadow-[0_0_18px_-4px_hsla(192_95%_60%/0.55)]",
  upcoming:
    "border border-violet/30 bg-gradient-to-r from-violet/20 via-indigo/10 to-violet/20 text-violet",
  ended: "border border-white/10 bg-white/5 text-muted-foreground",
  sold_out:
    "border border-pink/30 bg-gradient-to-r from-pink/20 via-rose-500/10 to-pink/20 text-pink shadow-[0_0_18px_-4px_hsla(330_95%_68%/0.55)]",
};

function StatusPill({ status }: { status: CampaignStatus }) {
  return (
    <Badge
      variant={statusVariantMap[status]}
      className={cn(
        "gap-1 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md",
        statusPillClass[status],
      )}
    >
      {status === "active" && (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-cyan shadow-[0_0_8px_hsla(192_95%_60%/0.9)]"
        />
      )}
      {status.replace("_", " ")}
    </Badge>
  );
}

function EmptyOrb({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -m-6 animate-glow-pulse rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, hsla(252 95% 70% / 0.35), transparent 70%)",
          }}
        />
        <div className="glass-strong relative flex size-24 animate-float items-center justify-center rounded-full ring-1 ring-violet/30">
          <Icon
            className="size-10 text-violet drop-shadow-[0_2px_12px_hsla(252,95%,70%,0.6)]"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-medium tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

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
        <div className="group relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-violet/0 via-violet/0 to-cyan/0 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
            style={{
              background:
                "linear-gradient(135deg, hsla(252 95% 70% / 0.35), hsla(192 95% 60% / 0.35))",
              padding: "1px",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-violet"
            strokeWidth={2}
          />
          <Input
            placeholder="Search campaigns by name or creator..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 border-white/10 bg-white/[0.04] pl-9 text-sm backdrop-blur-md placeholder:text-muted-foreground/60 focus-visible:border-violet/40 focus-visible:ring-violet/30"
          />
        </div>
      )}

      {isEmpty && (
        <EmptyOrb
          icon={Sparkles}
          title="No campaigns yet"
          description="Check back soon for new badge campaigns"
        />
      )}

      {noResults && (
        <EmptyOrb
          icon={Search}
          title="No campaigns match"
          description="Try a different search term"
        />
      )}

      {processed.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processed.map((campaign, idx) => (
            <div
              key={campaign.campaignId}
              className="animate-fade-up opacity-0"
              style={{
                animationDelay: `${Math.min(idx * 60, 480)}ms`,
                animationFillMode: "forwards",
              }}
            >
              <TiltCard intensity={8} className="h-full rounded-xl">
                <Card className="gradient-border glass relative flex h-full flex-col overflow-hidden border-0 bg-transparent ring-0 transition-shadow hover:shadow-[0_18px_60px_-20px_hsla(252_95%_70%/0.45)]">
                  <div className="relative aspect-video overflow-hidden">
                    {campaign.imageUrl ? (
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.name}
                        className="size-full object-cover transition-transform duration-700 group-hover/tilt:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-violet/10 via-transparent to-cyan/10">
                        <ImageOff
                          className="size-8 text-muted-foreground/50"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
                    />
                    <div className="absolute right-3 top-3 z-10">
                      <StatusPill status={campaign.status} />
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col gap-3 pt-4">
                    <h3 className="truncate font-heading text-base font-semibold">
                      {campaign.name}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {campaign.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="gap-1 border-white/10 bg-white/5 font-mono text-[10px]"
                      >
                        {campaign.creator.slice(0, 6)}…
                        {campaign.creator.slice(-4)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="gap-1 border-white/10 bg-white/5"
                      >
                        <Users className="size-3" />
                        {campaign.mintedCount}/{campaign.maxSupply}
                      </Badge>
                      {campaign.soulbound && (
                        <Badge
                          variant="secondary"
                          className="gap-1 border border-violet/30 bg-violet/10 text-violet"
                        >
                          <Lock className="size-3" />
                          Soulbound
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={buildClaimLink(campaign.campaignId)}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "mt-auto w-full bg-gradient-to-r from-violet via-indigo to-cyan text-white shadow-[0_0_18px_-4px_hsla(252_95%_70%/0.55)] transition-opacity hover:opacity-90",
                      )}
                    >
                      Claim
                    </Link>
                  </CardContent>
                </Card>
              </TiltCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
