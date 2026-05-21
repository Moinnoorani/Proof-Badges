import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Plus,
  Compass,
  Layers,
  Award,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { campaigns as campaignsSchema } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { DiscoveryGrid } from "@/components/discovery-grid";
import { FloatingBadge3D } from "@/components/floating-badge-3d";
import { TiltCard } from "@/components/tilt-card";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { BADGE_CONTRACT_ADDRESS, BASE_SEPOLIA_RPC } from "@/lib/public-env";

const badgeContractAbi = [
  {
    type: "function",
    name: "nextCampaignId",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextTokenId",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
] as const;

async function getCampaigns() {
  try {
    const records = await db
      .select()
      .from(campaignsSchema)
      .orderBy(desc(campaignsSchema.createdAt))
      .limit(60);
      
    return records.map((record) => ({
      ...record,
      id: record.campaignId,
    }));
  } catch (err) {
    console.error("Failed to fetch campaigns:", err);
    return null;
  }
}

async function getStats(campaigns: any[]) {
  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC),
    });

    const [nextCampaignId, nextTokenId] = await Promise.all([
      publicClient.readContract({
        address: BADGE_CONTRACT_ADDRESS as `0x${string}`,
        abi: badgeContractAbi,
        functionName: "nextCampaignId",
      }),
      publicClient.readContract({
        address: BADGE_CONTRACT_ADDRESS as `0x${string}`,
        abi: badgeContractAbi,
        functionName: "nextTokenId",
      }),
    ]);

    const totalCampaigns = Number(nextCampaignId) - 1;
    const totalMinted = Number(nextTokenId) - 1;
    const uniqueCreators = new Set(campaigns.map((c) => c.creator.toLowerCase())).size;

    return [
      { label: "Campaigns", value: totalCampaigns.toString(), icon: Layers, accent: "text-violet" },
      { label: "Badges Minted", value: totalMinted.toString(), icon: Award, accent: "text-pink" },
      { label: "Creators", value: uniqueCreators.toString(), icon: Users, accent: "text-cyan" },
    ];
  } catch (err) {
    console.error("Failed to fetch stats:", err);
    // Fallback if contract read fails
    const uniqueCreators = new Set((campaigns || []).map((c) => c.creator?.toLowerCase())).size;
    return [
      { label: "Campaigns", value: (campaigns || []).length.toString(), icon: Layers, accent: "text-violet" },
      { label: "Badges Minted", value: "...", icon: Award, accent: "text-pink" },
      { label: "Creators", value: uniqueCreators.toString(), icon: Users, accent: "text-cyan" },
    ];
  }
}

export default async function HomePage() {
  const campaigns = await getCampaigns();

  if (campaigns === null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-32 text-center">
        <div className="glass flex size-16 items-center justify-center rounded-full">
          <AlertCircle className="size-8 text-destructive/80" />
        </div>
        <h3 className="mt-6 text-lg font-medium">Something went wrong</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load campaigns. Please try again later.
        </p>
      </div>
    );
  }

  const dynamicStats = await getStats(campaigns);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24 lg:pb-28">
          <div className="relative animate-fade-up">
            {/* eyebrow */}
            <div className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_10px_hsl(var(--cyan))]" />
              Live on Base Sepolia
            </div>

            <h1 className="mt-6 font-heading text-6xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-[5.5rem]">
              <span className="text-gradient">Proof</span>
              <span className="block text-foreground/90">
                of being there.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Onchain badges, gasless and instant. Claim your reputation on Base
              — no gas, no friction, just proof.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#campaigns"
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
                <Compass className="relative z-10 size-4" />
                <span className="relative z-10">Discover Campaigns</span>
                <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/creator/new"
                className="glass-strong group inline-flex h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-medium text-foreground transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <Plus className="size-4 text-violet" />
                Create One
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4">
              {dynamicStats.map((s, i) => (
                <TiltCard
                  key={s.label}
                  intensity={8}
                  className="rounded-2xl"
                >
                  <div
                    className="glass gradient-border relative flex flex-col gap-1 rounded-2xl px-4 py-4 sm:px-5 sm:py-5"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                      <s.icon className={`size-3.5 ${s.accent}`} />
                      {s.label}
                    </div>
                    <div className="font-mono text-2xl font-semibold sm:text-3xl">
                      {s.value}
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          </div>

          {/* 3D badge column */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(closest-side, hsla(268 95% 60% / 0.18), transparent 70%)",
              }}
            />
            <FloatingBadge3D className="animate-scale-in" />
          </div>
        </div>
      </section>

      {/* CAMPAIGNS GRID */}
      <section
        id="campaigns"
        className="relative scroll-mt-20 border-t border-white/5"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Live & Upcoming
              </div>
              <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="text-gradient-warm">Discover</span>{" "}
                <span className="text-foreground/90">Campaigns</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Find and claim gasless badges from active campaigns.
              </p>
            </div>
            <Link
              href="/creator/new"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Launch a campaign
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <DiscoveryGrid campaigns={campaigns as any[]} />
        </div>
      </section>
    </>
  );
}
