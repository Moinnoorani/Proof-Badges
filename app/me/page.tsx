"use client";

import { useAccount } from "wagmi";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BadgeGrid } from "@/components/badge-grid";
import { NetworkGuard } from "@/components/network-guard";

function MePageContent() {
  const { address, isConnected } = useAccount();

  const handleShare = () => {
    if (!address) return;
    const url = `${window.location.origin}/profile/${address}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Profile link copied to clipboard"),
      () => toast.error("Failed to copy link")
    );
  };

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Share2 className="mb-4 size-16 text-muted-foreground/40" />
        <h3 className="mb-2 text-lg font-medium">Connect your wallet</h3>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to see your badges
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Badges</h1>
          <p className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <Button variant="outline" onClick={handleShare}>
          <Copy className="mr-2 size-4" />
          Share
        </Button>
      </div>
      <BadgeGrid address={address} />
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
