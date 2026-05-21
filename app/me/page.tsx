"use client";

import { useAccount } from "wagmi";
import { Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BadgeGrid } from "@/components/badge-grid";
import { NetworkGuard } from "@/components/network-guard";

function AddressAvatar({ address }: { address: string }) {
  const initials = address.slice(2, 6).toUpperCase();
  return (
    <span
      className="relative flex size-12 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold tracking-wider text-white ring-1 ring-white/15"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--violet)) 0%, hsl(var(--indigo)) 50%, hsl(var(--cyan)) 100%)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, hsla(0 0% 100% / 0.35), transparent 45%)",
          mixBlendMode: "screen",
        }}
      />
      <span className="relative">{initials}</span>
    </span>
  );
}

function MePageContent() {
  const { address, isConnected } = useAccount();

  const handleShare = () => {
    if (!address) return;
    const url = `${window.location.origin}/profile/${address}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Profile link copied to clipboard"),
      () => toast.error("Failed to copy link"),
    );
  };

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
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
            <Wallet
              className="size-10 text-violet drop-shadow-[0_2px_12px_hsla(252,95%,70%,0.6)]"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Connect your <span className="text-gradient">wallet</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect to see your badge collection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 md:py-14">
      {/* Hero */}
      <header className="relative animate-fade-up space-y-6">
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            <span className="text-foreground/90">My</span>{" "}
            <span className="text-gradient">Collection</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Every badge you’ve earned, grouped by campaign.
          </p>
        </div>

        {/* Profile chip */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="gradient-border glass inline-flex items-center gap-3 rounded-full py-2 pr-4 pl-2">
            <AddressAvatar address={address} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Connected
              </span>
              <span className="font-mono text-sm font-medium text-foreground">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleShare}
            className="rounded-full border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
          >
            <Copy className="size-3.5" />
            Share
          </Button>
        </div>
      </header>

      <div
        className="animate-fade-up opacity-0"
        style={{ animationDelay: "120ms", animationFillMode: "forwards" }}
      >
        <BadgeGrid address={address} />
      </div>
    </div>
  );
}

export default function MePage() {
  return (
    <NetworkGuard>
      <MePageContent />
    </NetworkGuard>
  );
}
