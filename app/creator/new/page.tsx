"use client";

import { CampaignForm } from "@/components/campaign-form";
import { NetworkGuard } from "@/components/network-guard";

export default function NewCampaignPage() {
  return (
    <NetworkGuard>
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">New Campaign</h1>
            <p className="text-sm text-muted-foreground">
              Create a gasless badge campaign on Base Sepolia
            </p>
          </div>
          <CampaignForm />
        </div>
      </div>
    </NetworkGuard>
  );
}
