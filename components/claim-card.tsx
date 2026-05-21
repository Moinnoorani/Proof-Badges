"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  ImageOff,
  Sparkles,
  Lock,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCampaign } from "@/hooks/use-campaign";
import { BASESCAN_TX_URL } from "@/lib/public-env";
import { useUgfClaim } from "@/hooks/use-ugf-claim";
import { canClaim } from "@/lib/eligibility";
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
import { Skeleton } from "@/components/ui/skeleton";
import { TiltCard } from "@/components/tilt-card";
import { UgfPipelinePanel } from "@/components/ugf-pipeline-panel";
import { NetworkGuard } from "@/components/network-guard";
import { OnboardingSteps } from "@/components/onboarding-steps";
import {
  type CampaignStatus,
} from "@/lib/status";
import { cn } from "@/lib/utils";

interface ClaimCardProps {
  campaignId: string;
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

export function ClaimCard({ campaignId }: ClaimCardProps) {
  const { address: _address, isConnected } = useAccount();
  const { campaign, isLoading, error: campaignError, refresh } =
    useCampaign(campaignId);
  const { claim, pipeline, retry, reset, txHash: _txHash } = useUgfClaim();
  const [claimStarted, setClaimStarted] = useState(false);
  const [claimConfirmed, setClaimConfirmed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isClaimAllowed = campaign
    ? canClaim({
        status: campaign.status,
        alreadyClaimed: campaign.alreadyClaimed,
        balance: BigInt(0),
        quote: BigInt(0),
      })
    : false;

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

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="gradient-border glass relative overflow-hidden rounded-2xl">
          <div className="space-y-4 p-6">
            <Skeleton className="aspect-video w-full rounded-xl bg-white/5" />
            <Skeleton className="h-6 w-3/4 bg-white/5" />
            <Skeleton className="h-4 w-1/2 bg-white/5" />
            <Skeleton className="h-20 w-full bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (campaignError === "not_found") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="gradient-border glass-strong relative overflow-hidden rounded-2xl">
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-4 animate-glow-pulse rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, hsla(330 95% 65% / 0.45), transparent 70%)",
                }}
              />
              <div className="glass-strong relative flex size-16 animate-float items-center justify-center rounded-full ring-1 ring-pink/30">
                <AlertCircle
                  className="size-8 text-pink"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <CardTitle className="text-gradient-warm font-heading text-xl">
              Campaign Not Found
            </CardTitle>
            <CardDescription>
              This campaign does not exist or has been removed.
            </CardDescription>
            <Link href="/">
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
              >
                Browse Campaigns
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (campaignError === "metadata_unavailable") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="gradient-border glass-strong relative overflow-hidden rounded-2xl">
          <div className="flex flex-col items-center gap-5 p-8 text-center">
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 -m-4 animate-glow-pulse rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, hsla(252 95% 70% / 0.4), transparent 70%)",
                }}
              />
              <div className="glass-strong relative flex size-16 animate-float items-center justify-center rounded-full ring-1 ring-violet/30">
                <AlertCircle
                  className="size-8 text-violet"
                  strokeWidth={1.5}
                />
              </div>
            </div>
            <CardTitle className="text-gradient font-heading text-xl">
              Metadata Unavailable
            </CardTitle>
            <CardDescription>
              Campaign metadata is temporarily unavailable. Please try again
              later.
            </CardDescription>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const pipelineActive = claimStarted && pipeline.confirm !== "success";
  const showSuccess = claimConfirmed;
  const isSubmitting = pipelineActive && !pipeline.failedStage;

  return (
    <NetworkGuard>
      <div className="mx-auto w-full max-w-lg">
        <Card className="gradient-border glass relative overflow-hidden border-0 bg-transparent ring-0">
          {/* Hero image with subtle tilt */}
          <TiltCard intensity={6} glare={false} className="rounded-t-xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
              {campaign.imageUrl ? (
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 480px"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-violet/10 via-transparent to-cyan/10">
                  <ImageOff
                    className="size-10 text-muted-foreground/50"
                    strokeWidth={1.5}
                  />
                </div>
              )}

              {/* Gradient bottom overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
              />

              {/* Floating particles */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
              >
                <div
                  className="absolute left-[18%] top-[28%] size-1.5 animate-float rounded-full bg-cyan/80 shadow-[0_0_10px_hsla(192_95%_60%/0.9)]"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="absolute right-[22%] top-[18%] size-1 animate-float rounded-full bg-violet/80 shadow-[0_0_10px_hsla(252_95%_70%/0.9)]"
                  style={{ animationDelay: "1.4s" }}
                />
                <div
                  className="absolute left-[58%] top-[40%] size-1 animate-float rounded-full bg-pink/70 shadow-[0_0_10px_hsla(330_95%_68%/0.85)]"
                  style={{ animationDelay: "2.6s" }}
                />
              </div>

              {/* Status pill on image */}
              <div className="absolute right-3 top-3 z-10">
                <StatusPill status={campaign.status} />
              </div>
            </div>
          </TiltCard>

          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <CardTitle className="font-heading text-lg font-semibold">
                  {campaign.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  by{" "}
                  <span className="font-mono text-muted-foreground/90">
                    {campaign.creator.slice(0, 6)}…
                    {campaign.creator.slice(-4)}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {campaign.description || "No description"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-white/10 bg-white/5 text-muted-foreground"
              >
                <Users className="size-3" />
                {campaign.mintedCount} / {campaign.maxSupply} minted
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

            {campaign.alreadyClaimed && !showSuccess && (
              <div className="gradient-border glass flex items-center justify-center gap-2 rounded-lg p-4 text-center">
                <CheckCircle2 className="size-4 text-cyan" />
                <p className="text-sm font-medium text-muted-foreground">
                  You have already claimed this badge
                </p>
              </div>
            )}

            {showSuccess && (
              <div className="gradient-border glass relative overflow-hidden rounded-xl">
                <div className="shimmer absolute inset-0 rounded-xl" />
                <div className="relative space-y-3 p-5">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative">
                      <div
                        aria-hidden
                        className="absolute inset-0 -m-1 animate-glow-pulse rounded-full"
                        style={{
                          background:
                            "radial-gradient(closest-side, hsla(192 95% 60% / 0.55), transparent 70%)",
                        }}
                      />
                      <CheckCircle2
                        className="relative size-6 text-cyan drop-shadow-[0_0_10px_hsla(192,95%,60%,0.8)]"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="text-gradient font-heading text-base font-semibold">
                      Badge claimed successfully
                    </p>
                  </div>
                  {pipeline.txHash && (
                    <a
                      href={`${BASESCAN_TX_URL}${pipeline.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-cyan"
                    >
                      <ExternalLink className="size-3" />
                      View on BaseScan
                    </a>
                  )}
                  <div className="flex justify-center pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReset}
                      className="border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
                    >
                      <RotateCcw className="size-3.5" />
                      Claim another
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!showSuccess && !isConnected && (
              <OnboardingSteps step1Done={false} />
            )}

            {!showSuccess && isConnected && !campaign.alreadyClaimed && (
              <>
                <OnboardingSteps step1Done={true} />

                {pipelineActive && <UgfPipelinePanel pipeline={pipeline} />}

                {!pipelineActive && (
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      onClick={handleClaim}
                      disabled={!isClaimAllowed || isSubmitting}
                      className={cn(
                        "shimmer relative h-12 w-full overflow-hidden rounded-xl text-base font-semibold tracking-tight text-white",
                        "bg-gradient-to-r from-violet via-indigo to-cyan",
                        "shadow-[0_8px_30px_-6px_hsla(252_95%_70%/0.6)] hover:opacity-95",
                        "disabled:cursor-not-allowed disabled:opacity-40",
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4" />
                          Claim Badge
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {!showSuccess && isConnected && campaign.alreadyClaimed && (
              <div className="flex justify-center">
                <Link href="/">
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
                  >
                    Browse more badges
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>

          {pipeline.failedStage && !showSuccess && (
            <CardFooter className="flex justify-center gap-2 border-white/5 bg-white/[0.02] backdrop-blur-md">
              <Button
                variant="outline"
                onClick={handleRetry}
                className="border-pink/40 bg-pink/10 text-pink hover:bg-pink/20"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </NetworkGuard>
  );
}
