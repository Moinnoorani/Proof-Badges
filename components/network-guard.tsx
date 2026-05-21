"use client";

import { type ReactNode, useState, useEffect } from "react";
import { AlertTriangle, ArrowLeftRight, Plus } from "lucide-react";
import { useNetworkGuard } from "@/hooks/use-network-guard";
import { Button } from "@/components/ui/button";

export function NetworkGuard({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { isCorrectNetwork, switchToBaseSepolia, addBaseSepolia } =
    useNetworkGuard();

  // Server render and initial client render must match
  if (!mounted) return <>{children}</>;

  if (isCorrectNetwork) return <>{children}</>;

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-12">
      {/* Ambient backdrop glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, hsla(330 95% 65% / 0.18), transparent 70%)",
        }}
      />

      <div className="gradient-border glass-strong relative w-full max-w-md animate-scale-in overflow-hidden rounded-2xl">
        <div className="shimmer absolute inset-0 rounded-2xl" />

        <div className="relative flex flex-col items-center gap-5 p-8 text-center">
          {/* Warning orb */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-6 animate-glow-pulse rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, hsla(330 95% 65% / 0.45), transparent 70%)",
              }}
            />
            <div className="glass-strong relative flex size-20 animate-float items-center justify-center rounded-full ring-1 ring-pink/30">
              <AlertTriangle
                className="size-9 text-pink drop-shadow-[0_2px_12px_hsla(330,95%,68%,0.6)]"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-gradient-warm font-heading text-2xl font-semibold tracking-tight">
              Wrong Network
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Please switch to Base Sepolia to continue. This experience is
              only available on the Base Sepolia testnet.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              onClick={switchToBaseSepolia}
              size="lg"
              className="w-full bg-gradient-to-r from-violet via-indigo to-cyan text-white shadow-[0_0_30px_hsla(252_95%_70%/0.35)] hover:opacity-90"
            >
              <ArrowLeftRight className="size-4" />
              Switch to Base Sepolia
            </Button>
            <Button
              variant="outline"
              onClick={addBaseSepolia}
              size="lg"
              className="w-full border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10"
            >
              <Plus className="size-4" />
              Add Base Sepolia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
