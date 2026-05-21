"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  Sparkles,
  Wallet,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { CampaignCard, type CampaignCardData } from "@/components/campaign-card";
import { Skeleton } from "@/components/ui/skeleton";
import { sortCampaignsByRecency } from "@/lib/sort-campaigns";
import { NetworkGuard } from "@/components/network-guard";
import { ScrollParallaxContainer } from "@/components/scroll-parallax-container";

function CreateCampaignButton({ first = false }: { first?: boolean }) {
  return (
    <Link
      href="/creator/new"
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
      <Plus className="relative z-10 size-4" />
      <span className="relative z-10">
        {first ? "Create your first campaign" : "New campaign"}
      </span>
      <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="gradient-border glass relative overflow-hidden rounded-xl p-0"
        >
          <div className="shimmer absolute inset-0" />
          <div className="relative space-y-3 p-3">
            <Skeleton className="aspect-video w-full rounded-lg bg-white/5" />
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            <Skeleton className="h-3 w-1/2 bg-white/5" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
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
          <Layers
            className="size-10 text-violet drop-shadow-[0_2px_12px_hsla(252,95%,70%,0.6)]"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-medium tracking-tight">
          No campaigns yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Launch your first gasless badge campaign on Base Sepolia
        </p>
      </div>
      <CreateCampaignButton first />
    </div>
  );
}

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
      const data = (await res.json()) as CampaignCardData[];
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
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -m-6 animate-glow-pulse rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, hsla(192 95% 60% / 0.35), transparent 70%)",
            }}
          />
          <div className="glass-strong relative flex size-24 animate-float items-center justify-center rounded-full ring-1 ring-cyan/30">
            <Wallet
              className="size-10 text-cyan drop-shadow-[0_2px_12px_hsla(192,95%,60%,0.6)]"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Connect your <span className="text-gradient">wallet</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect to view and manage your badge campaigns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero strip */}
      <header className="relative animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="gradient-border inline-flex rounded-full">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="size-3 text-violet" />
                Creator Studio
              </span>
            </div>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              <span className="text-foreground/90">Manage your</span>{" "}
              <span className="text-gradient">campaigns</span>
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
              Mint, share, and grow your on-chain badge collections — all
              gasless on Base Sepolia.
            </p>
          </div>
          <CreateCampaignButton />
        </div>
      </header>

      {/* New campaign highlight banner */}
      {newCampaignId && (
        <div className="gradient-border glass glow-cyan relative animate-scale-in overflow-hidden rounded-xl">
          <div className="shimmer absolute inset-0" />
          <div className="relative flex items-center gap-3 px-5 py-4">
            <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-indigo text-white shadow-[0_0_18px_hsla(192_95%_60%/0.55)] ring-1 ring-cyan/40">
              <CheckCircle2 className="size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="font-heading text-sm font-semibold">
                <span className="text-gradient">Campaign created.</span>{" "}
                <span className="text-foreground/90">It’s live below.</span>
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                #{newCampaignId}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && sortedCampaigns.length === 0 && <EmptyState />}

      {!loading && sortedCampaigns.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCampaigns.map((c, idx) => (
            <div
              key={c.id}
              className="animate-fade-up opacity-0"
              style={{
                animationDelay: `${Math.min(idx * 60, 480)}ms`,
                animationFillMode: "forwards",
              }}
            >
              <CampaignCard
                campaign={c}
                management
                highlighted={c.id === newCampaignId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <NetworkGuard>
      <div className="relative min-h-screen px-4 py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl">
          <ScrollParallaxContainer
            rotationIntensity={0.0}
            translationIntensity={0.2}
            scaleEffect={false}
          >
            <Suspense
              fallback={
                <div className="space-y-8">
                  <Skeleton className="h-12 w-64 rounded-full bg-white/5" />
                  <LoadingSkeleton />
                </div>
              }
            >
              <CreatorDashboardContent />
            </Suspense>
          </ScrollParallaxContainer>
        </div>
      </div>
    </NetworkGuard>
  );
}
