"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useBalance } from "wagmi";
import { ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCampaign } from "@/hooks/use-campaign";
import { useUgfClaim } from "@/hooks/use-ugf-claim";
import { canClaim, showFaucet } from "@/lib/eligibility";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UgfPipelinePanel } from "@/components/ugf-pipeline-panel";
import { NetworkGuard } from "@/components/network-guard";
import { OnboardingSteps } from "@/components/onboarding-steps";

interface ClaimCardProps {
  campaignId: string;
}

export function ClaimCard({ campaignId }: ClaimCardProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { campaign, isLoading, error: campaignError, refresh } = useCampaign(campaignId);
  const { claim, pipeline, retry, reset, txHash: _txHash, quote } = useUgfClaim();
  const [step2Done, setStep2Done] = useState(false);
  const [claimStarted, setClaimStarted] = useState(false);
  const [claimConfirmed, setClaimConfirmed] = useState(false);

  const balance = balanceData?.value ?? BigInt(0);
  const quoteValue = quote ?? BigInt(0);

  const isClaimAllowed = campaign
    ? canClaim({
        status: campaign.status,
        alreadyClaimed: campaign.alreadyClaimed,
        balance,
        quote: quoteValue,
      })
    : false;

  const needsFaucet = showFaucet({ balance, quote: quoteValue });

  useEffect(() => {
    if (pipeline.confirm === "success" && claimStarted) {
      setClaimConfirmed(true);
      toast.success("Badge claimed successfully!");
      refresh();
    }
  }, [pipeline.confirm, claimStarted, refresh]);

  useEffect(() => {
    if (pipeline.failedStage && claimStarted) {
      toast.error(pipeline.errorMessage ?? "Claim failed");
    }
  }, [pipeline.failedStage, pipeline.errorMessage, claimStarted]);

  const handleClaim = () => {
    setClaimStarted(true);
    claim(BigInt(campaignId));
  };

  const handleRetry = () => {
    retry();
  };

  const handleReset = () => {
    reset();
    setClaimStarted(false);
    setClaimConfirmed(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (campaignError === "not_found") {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="size-12 text-destructive" />
          <CardTitle>Campaign Not Found</CardTitle>
          <CardDescription>
            This campaign does not exist or has been removed.
          </CardDescription>
          <Link href="/">
            <Button variant="outline">Browse Campaigns</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (campaignError === "metadata_unavailable") {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="size-12 text-muted-foreground" />
          <CardTitle>Metadata Unavailable</CardTitle>
          <CardDescription>
            Campaign metadata is temporarily unavailable. Please try again later.
          </CardDescription>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!campaign) {
    return null;
  }

  const statusVariant =
    campaign.status === "active"
      ? "default"
      : campaign.status === "upcoming"
        ? "secondary"
        : campaign.status === "ended"
          ? "outline"
          : "destructive";

  const pipelineActive = claimStarted && pipeline.confirm !== "success";
  const showSuccess = claimConfirmed;

  return (
    <NetworkGuard>
      <Card className="w-full max-w-lg mx-auto">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {campaign.imageUrl ? (
            <Image
              src={campaign.imageUrl}
              alt={campaign.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 480px"
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
                by {campaign.creator.slice(0, 6)}…{campaign.creator.slice(-4)}
              </CardDescription>
            </div>
            <Badge variant={statusVariant}>{campaign.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
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

          {campaign.alreadyClaimed && !showSuccess && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                You have already claimed this badge
              </p>
            </div>
          )}

          {showSuccess && (
            <div className="rounded-lg bg-primary/10 p-4 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="size-5 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Badge claimed successfully!
                </p>
              </div>
              {pipeline.txHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${pipeline.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground justify-center"
                >
                  <ExternalLink className="size-3" />
                  View on BaseScan
                </a>
              )}
              <div className="flex justify-center">
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Claim another
                </Button>
              </div>
            </div>
          )}

          {!showSuccess && !isConnected && (
            <OnboardingSteps
              step1Done={false}
              step2Done={false}
              onMarkStep2Done={() => {}}
            />
          )}

          {!showSuccess && isConnected && !campaign.alreadyClaimed && (
            <>
              <OnboardingSteps
                step1Done={true}
                step2Done={step2Done}
                onMarkStep2Done={() => setStep2Done(true)}
              />

              {pipelineActive && (
                <UgfPipelinePanel pipeline={pipeline} />
              )}

              {!pipelineActive && (
                <div className="space-y-3">
                  {needsFaucet && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Your balance is low. Get testnet tokens from the faucet before claiming.
                      </p>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleClaim}
                    disabled={!isClaimAllowed}
                  >
                    Claim Badge
                  </Button>
                  {!isClaimAllowed && needsFaucet && (
                    <p className="text-xs text-center text-muted-foreground">
                      Get testnet tokens to cover the claim fee
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!showSuccess && isConnected && campaign.alreadyClaimed && (
            <div className="flex justify-center">
              <Link href="/">
                <Button variant="outline">Browse more badges</Button>
              </Link>
            </div>
          )}
        </CardContent>
        {pipeline.failedStage && !showSuccess && (
          <CardFooter className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          </CardFooter>
        )}
      </Card>
    </NetworkGuard>
  );
}
