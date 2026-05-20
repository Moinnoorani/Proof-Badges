import { isAddress } from "viem";
import { AlertCircle } from "lucide-react";
import { BadgeGrid } from "@/components/badge-grid";
import { NetworkGuard } from "@/components/network-guard";

export default function ProfilePage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;

  if (!isAddress(address)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="mb-4 size-16 text-destructive/60" />
        <h3 className="mb-2 text-lg font-medium">Invalid address</h3>
        <p className="text-sm text-muted-foreground">
          The provided wallet address is not valid
        </p>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Badges</h1>
          <p className="text-sm text-muted-foreground">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <BadgeGrid address={address as `0x${string}`} />
      </div>
    </NetworkGuard>
  );
}
