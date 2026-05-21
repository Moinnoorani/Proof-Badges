import { isAddress } from "viem";
import { AlertCircle } from "lucide-react";
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

export default function ProfilePage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;

  if (!isAddress(address)) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -m-6 animate-glow-pulse rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, hsla(330 95% 65% / 0.4), transparent 70%)",
            }}
          />
          <div className="glass-strong relative flex size-24 animate-float items-center justify-center rounded-full ring-1 ring-pink/30">
            <AlertCircle
              className="size-10 text-pink drop-shadow-[0_2px_12px_hsla(330,95%,68%,0.6)]"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <div className="max-w-sm space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            <span className="text-gradient-warm">Invalid</span>{" "}
            <span className="text-foreground/90">address</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            The provided wallet address is not valid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-10 md:py-14">
        <header className="relative animate-fade-up space-y-6">
          <div className="space-y-3">
            <div className="gradient-border inline-flex rounded-full">
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Public profile
              </span>
            </div>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              <span className="text-gradient">Badges</span>{" "}
              <span className="text-foreground/90">on chain</span>
            </h1>
          </div>

          {/* Profile chip (read-only) */}
          <div className="gradient-border glass inline-flex items-center gap-3 rounded-full py-2 pr-4 pl-2">
            <AddressAvatar address={address} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Wallet
              </span>
              <span className="font-mono text-sm font-medium text-foreground">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            </div>
          </div>
        </header>

        <div
          className="animate-fade-up opacity-0"
          style={{ animationDelay: "120ms", animationFillMode: "forwards" }}
        >
          <BadgeGrid address={address as `0x${string}`} />
        </div>
      </div>
    </NetworkGuard>
  );
}
