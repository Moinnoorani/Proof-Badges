"use client";

import Link from "next/link";
import Image from "next/image";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deriveStatus, type CampaignStatus } from "@/lib/status";
import { buildClaimLink } from "@/lib/claim-link";
import { QrDownloadButton } from "@/components/qr-download-button";

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

export function CampaignCard({ campaign, management, highlighted }: CampaignCardProps) {
  const status: CampaignStatus = deriveStatus(
    {
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      maxSupply: campaign.maxSupply,
      mintedCount: campaign.mintedCount,
    },
    Math.floor(Date.now() / 1000),
  );

  const statusVariant =
    status === "active"
      ? "default"
      : status === "upcoming"
        ? "secondary"
        : status === "ended"
          ? "outline"
          : "destructive";

  const creatorShort = `${campaign.creator.slice(0, 6)}…${campaign.creator.slice(-4)}`;
  const claimPath = buildClaimLink(campaign.id);

  const copyLink = () => {
    const url = `${window.location.origin}${claimPath}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard");
    });
  };

  return (
    <Card className={highlighted ? "ring-2 ring-primary" : ""}>
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
        {campaign.imageUrl ? (
          <Image
            src={campaign.imageUrl}
            alt={campaign.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>
              by {creatorShort}
            </CardDescription>
          </div>
          <Badge variant={statusVariant}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {campaign.description || "No description"}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {campaign.mintedCount} / {campaign.maxSupply} minted
          </Badge>
          {campaign.soulbound && (
            <Badge variant="secondary">Soulbound</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Link href={claimPath}>
          <Button size="sm" variant="default">
            <ExternalLink className="size-3.5" />
            View
          </Button>
        </Link>
        {management && (
          <>
            <Button size="sm" variant="outline" onClick={copyLink}>
              <Copy className="size-3.5" />
              Copy Link
            </Button>
            <QrDownloadButton campaignId={campaign.id} />
          </>
        )}
      </CardFooter>
    </Card>
  );
}
