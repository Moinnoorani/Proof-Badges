"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useOwnedBadges } from "@/hooks/use-owned-badges";
import { cn } from "@/lib/utils";

function BadgeSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function BadgeGrid({ address, className }: { address: `0x${string}`; className?: string }) {
  const { badges, isLoading, isEmpty } = useOwnedBadges(address);

  if (isLoading) {
    return (
      <div className={cn("space-y-8", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 4 }).map((_, j) => (
                <BadgeSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
        <Shield className="mb-4 size-16 text-muted-foreground/40" />
        <h3 className="mb-2 text-lg font-medium">No badges yet</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          Explore campaigns and claim your first badge
        </p>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Find a Campaign
        </Link>
      </div>
    );
  }

  const entries = Object.entries(badges);

  return (
    <div className={cn("space-y-8", className)}>
      {entries.map(([campaignId, campaignBadges]) => (
        <section key={campaignId}>
          <CardTitle className="mb-3 px-1">Campaign #{campaignId}</CardTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {campaignBadges.map((badge) => (
              <Card key={badge.tokenId} size="sm">
                <div className="aspect-square overflow-hidden">
                  {badge.imageUrl ? (
                    <img
                      src={badge.imageUrl}
                      alt={badge.name ?? `Badge #${badge.tokenId}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <Shield className="size-8 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="space-y-1">
                  <p className="truncate text-sm font-medium">
                    {badge.name ?? `Badge #${badge.tokenId}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{badge.tokenId}
                  </p>
                  {badge.mintTimestamp && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(badge.mintTimestamp * 1000).toLocaleDateString()}
                    </p>
                  )}
                  {badge.soulbound && (
                    <Badge variant="secondary" className="mt-1">
                      <Shield className="mr-1 size-3" />
                      Soulbound
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
