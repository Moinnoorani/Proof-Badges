"use client";

import Link from "next/link";
import Image from "next/image";
import { Copy, ExternalLink, ImageOff, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/tilt-card";
import { deriveStatus, type CampaignStatus } from "@/lib/status";
import { buildClaimLink } from "@/lib/claim-link";
import { QrDownloadButton } from "@/components/qr-download-button";
import { cn } from "@/lib/utils";

export interface CampaignCardData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  maxSupply: number;
  mintedCount: number;
  startTime: number;
  endTime: number;
  soulbound: boolean;
  createdAt: number;
}

interface CampaignCardProps {
  campaign: CampaignCardData;
  management?: boolean;
  highlighted?: boolean;
}

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
  ended:
    "border border-white/10 bg-white/5 text-muted-foreground",
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

export function CampaignCard({
  campaign,
  management,
  highlighted,
}: CampaignCardProps) {
  const status: CampaignStatus = deriveStatus(
    {
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      maxSupply: campaign.maxSupply,
      mintedCount: campaign.mintedCount,
    },
    Math.floor(Date.now() / 1000),
  );

  const creatorShort = `${campaign.creator.slice(0, 6)}…${campaign.creator.slice(-4)}`;
  const claimPath = buildClaimLink(campaign.id);

  const copyLink = () => {
    const url = `${window.location.origin}${claimPath}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard");
    });
  };

  return (
    <TiltCard intensity={9} className="rounded-xl">
      <Card
        className={cn(
          "gradient-border glass relative overflow-hidden border-0 bg-transparent ring-0 transition-shadow",
          "hover:shadow-[0_18px_60px_-20px_hsla(252_95%_70%/0.45)]",
          highlighted &&
            "ring-2 ring-violet/60 shadow-[0_0_40px_-8px_hsla(252_95%_70%/0.55)]",
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
          {campaign.imageUrl ? (
            <Image
              src={campaign.imageUrl}
              alt={campaign.name}
              fill
              className="object-cover transition-transform duration-700 group-hover/tilt:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-violet/10 via-transparent to-cyan/10">
              <ImageOff
                className="size-8 text-muted-foreground/50"
                strokeWidth={1.5}
              />
            </div>
          )}
          {/* Gradient overlay on bottom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
          />
          {/* Status pill floating on image */}
          <div className="absolute right-3 top-3 z-10">
            <StatusPill status={status} />
          </div>
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate font-heading text-base font-semibold">
                {campaign.name}
              </CardTitle>
              <CardDescription className="text-xs">
                by{" "}
                <span className="font-mono text-muted-foreground/90">
                  {creatorShort}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {campaign.description || "No description"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-white/10 bg-white/5 text-muted-foreground"
            >
              <Users className="size-3" />
              {campaign.mintedCount} / {campaign.maxSupply}
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
        </CardContent>

        <CardFooter className="gap-2 border-white/5 bg-white/[0.02] backdrop-blur-md">
          <Link href={claimPath}>
            <Button
              size="sm"
              variant="default"
              className="bg-gradient-to-r from-violet via-indigo to-cyan text-white shadow-[0_0_18px_-4px_hsla(252_95%_70%/0.55)] hover:opacity-90"
            >
              <ExternalLink className="size-3.5" />
              View
            </Button>
          </Link>
          {management && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className="border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
              >
                <Copy className="size-3.5" />
                Copy Link
              </Button>
              <QrDownloadButton campaignId={campaign.id} />
            </>
          )}
        </CardFooter>
      </Card>
    </TiltCard>
  );
}
