"use client";

import { Sparkles } from "lucide-react";
import { CampaignForm } from "@/components/campaign-form";
import { NetworkGuard } from "@/components/network-guard";
import { ScrollParallaxContainer } from "@/components/scroll-parallax-container";

export default function NewCampaignPage() {
  return (
    <NetworkGuard>
      <div className="relative min-h-screen px-4 py-10 md:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <ScrollParallaxContainer
            rotationIntensity={0.3}
            translationIntensity={0.2}
            scaleEffect={false}
          >
            <div className="space-y-10">
              {/* Hero */}
              <header className="relative animate-fade-up text-center sm:text-left">
                <div className="gradient-border inline-flex rounded-full">
                  <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles className="size-3 text-violet" />
                    New Campaign
                  </span>
                </div>
                <h1 className="mt-4 font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                  <span className="text-foreground/90">Launch a</span>{" "}
                  <span className="text-gradient">gasless badge</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Configure your supply, schedule, and soulbound rules. We’ll
                  handle the gas via UGF on Base Sepolia.
                </p>
              </header>

              <div className="animate-fade-up opacity-0" style={{ animationDelay: "120ms", animationFillMode: "forwards" }}>
                <CampaignForm />
              </div>
            </div>
          </ScrollParallaxContainer>
        </div>
      </div>
    </NetworkGuard>
  );
}
