"use client";

import Link from "next/link";
import { Shield, Sparkles, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TiltCard } from "@/components/tilt-card";
import { useOwnedBadges } from "@/hooks/use-owned-badges";
import { cn } from "@/lib/utils";

function BadgeSkeleton() {
  return (
    <div className="gradient-border glass relative overflow-hidden rounded-xl p-2">
      <div className="shimmer absolute inset-0 rounded-xl" />
      <div className="relative space-y-2">
        <Skeleton className="aspect-square w-full rounded-lg bg-white/5" />
        <Skeleton className="h-3.5 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
      </div>
    </div>
  );
}

export function BadgeGrid({
  address,
  className,
}: {
  address: `0x${string}`;
  className?: string;
}) {
  const { badges, isLoading, isEmpty } = useOwnedBadges(address);

  if (isLoading) {
    return (
      <div className={cn("space-y-10", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className="space-y-4">
            <Skeleton className="h-6 w-48 bg-white/5" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <BadgeSkeleton key={j} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 py-20 text-center",
          className,
        )}
      >
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -m-6 animate-glow-pulse rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, hsla(252 95% 70% / 0.4), transparent 70%)",
            }}
          />
          <div className="glass-strong relative flex size-24 animate-float items-center justify-center rounded-full ring-1 ring-violet/30">
            <Shield
              className="size-10 text-violet drop-shadow-[0_2px_12px_hsla(252,95%,70%,0.6)]"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-medium tracking-tight">
            No badges yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Explore campaigns and claim your first badge
          </p>
        </div>
        <Link
          href="/"
          className="group relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_hsla(268,95%,60%,0.7)] transition-all hover:shadow-[0_10px_44px_-8px_hsla(268,95%,60%,0.9)]"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--violet)), hsl(var(--indigo)) 50%, hsl(var(--cyan)))",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0 animate-gradient-drift"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--violet)), hsl(var(--pink)) 35%, hsl(var(--cyan)) 70%, hsl(var(--violet)))",
              backgroundSize: "300% 300%",
              opacity: 0.95,
            }}
          />
          <span aria-hidden className="shimmer absolute inset-0 opacity-50" />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20"
          />
          <Sparkles className="relative z-10 size-4" />
          <span className="relative z-10">Find a campaign</span>
        </Link>
      </div>
    );
  }

  const entries = Object.entries(badges);

  return (
    <div className={cn("space-y-10", className)}>
      {entries.map(([campaignId, campaignBadges], sectionIdx) => (
        <section key={campaignId} className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="text-foreground/90">Campaign</span>{" "}
              <span className="text-gradient">#{campaignId}</span>
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {campaignBadges.length}{" "}
              {campaignBadges.length === 1 ? "badge" : "badges"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {campaignBadges.map((badge, idx) => {
              const animationDelay = `${
                sectionIdx * 80 + Math.min(idx * 60, 480)
              }ms`;
              return (
                <div
                  key={badge.tokenId}
                  className="animate-fade-up opacity-0"
                  style={{
                    animationDelay,
                    animationFillMode: "forwards",
                  }}
                >
                  <TiltCard intensity={7} className="h-full rounded-xl">
                    <div className="gradient-border glass relative flex h-full flex-col overflow-hidden rounded-xl transition-shadow hover:shadow-[0_18px_60px_-20px_hsla(252_95%_70%/0.45)]">
                      <div className="relative aspect-square overflow-hidden">
                        {badge.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={badge.imageUrl}
                            alt={badge.name ?? `Badge #${badge.tokenId}`}
                            className="size-full object-cover transition-transform duration-700 group-hover/tilt:scale-[1.05]"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-gradient-to-br from-violet/15 via-transparent to-cyan/15">
                            <Shield
                              className="size-10 text-muted-foreground/50"
                              strokeWidth={1.5}
                            />
                          </div>
                        )}

                        {/* Gradient bottom overlay */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
                        />

                        {/* Floating soulbound chip */}
                        {badge.soulbound && (
                          <div className="absolute right-2 top-2 z-10">
                            <Badge
                              variant="secondary"
                              className="gap-1 border border-violet/30 bg-violet/15 text-[10px] uppercase tracking-wider text-violet backdrop-blur-md"
                            >
                              <Lock className="size-2.5" />
                              Soulbound
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="relative flex flex-1 flex-col gap-1 p-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          {badge.name ?? `Badge #${badge.tokenId}`}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          #{badge.tokenId}
                        </p>
                        {badge.mintTimestamp && (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {new Date(
                              badge.mintTimestamp * 1000,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </TiltCard>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
