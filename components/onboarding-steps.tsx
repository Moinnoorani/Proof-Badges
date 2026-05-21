"use client";

import { Check, Wallet, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepsProps {
  step1Done: boolean;
}

export function OnboardingSteps({ step1Done }: OnboardingStepsProps) {
  return (
    <div className="gradient-border glass relative overflow-hidden rounded-xl">
      <div className="space-y-1 px-5 pt-4">
        <div className="font-heading text-base font-medium tracking-tight">
          Getting Started
        </div>
        <p className="text-xs text-muted-foreground">
          Complete these steps to claim your badge
        </p>
      </div>

      <div className="relative space-y-3 p-5 pt-4">
        {/* vertical connector */}
        <div
          aria-hidden
          className="absolute left-[2.4rem] top-12 h-9 w-px bg-gradient-to-b from-violet/40 via-indigo/30 to-transparent"
        />

        <Step
          number={1}
          title="Connect Wallet"
          description="Sign in with your Web3 wallet to begin"
          icon={Wallet}
          done={step1Done}
          active={!step1Done}
        />
        <Step
          number={2}
          title="Claim Badge"
          description="Mint your soulbound badge on Base"
          icon={Sparkles}
          done={false}
          active={step1Done}
          dimmed={!step1Done}
        />
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  icon: Icon,
  done,
  active,
  dimmed,
}: {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  done: boolean;
  active: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg p-2 transition-opacity",
        dimmed && "opacity-40",
      )}
    >
      <div className="relative">
        {active && !done && (
          <div
            aria-hidden
            className="absolute inset-0 -m-1 animate-glow-pulse rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, hsla(252 95% 70% / 0.55), transparent 70%)",
            }}
          />
        )}
        <div
          className={cn(
            "relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition-colors",
            done &&
              "bg-gradient-to-br from-cyan to-indigo text-white ring-cyan/40 shadow-[0_0_18px_hsla(192_95%_60%/0.45)]",
            !done &&
              active &&
              "bg-gradient-to-br from-violet to-indigo text-white ring-violet/40",
            !done && !active && "bg-white/5 text-muted-foreground ring-white/10",
          )}
        >
          {done ? (
            <Check className="size-4" strokeWidth={2.5} />
          ) : (
            <Icon className="size-4" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 pt-1">
        <p
          className={cn(
            "text-sm font-medium",
            done || active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground/80">{description}</p>
      </div>

      <div className="ml-auto pt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {String(number).padStart(2, "0")}
      </div>
    </div>
  );
}
