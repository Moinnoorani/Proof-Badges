"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import { Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const baseClasses =
  "group relative inline-flex h-9 items-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium text-white transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-violet/60 disabled:pointer-events-none disabled:opacity-50";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={cn(baseClasses, "shadow-[0_8px_30px_-8px_hsla(268,95%,60%,0.65)]")}
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--violet)) 0%, hsl(var(--indigo)) 50%, hsl(var(--cyan)) 100%)",
          backgroundSize: "200% 200%",
        }}
      >
        <Wallet className="relative z-10 size-4 opacity-0" />
        <span className="relative z-10 opacity-0">Connect Wallet</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        title={address}
        className={cn(baseClasses, "glass-strong border border-white/10 hover:border-white/20")}
      >
        <span className="size-2 rounded-full bg-cyan shadow-[0_0_10px_hsl(var(--cyan))]" />
        <span className="font-mono text-xs tracking-wide">{truncate(address)}</span>
        <LogOut className="size-3.5 text-muted-foreground transition-colors group-hover:text-white" />
      </button>
    );
  }

  const connector = connectors[0];
  return (
    <button
      type="button"
      onClick={() => connector && connect({ connector })}
      className={cn(baseClasses, "shadow-[0_8px_30px_-8px_hsla(268,95%,60%,0.65)] hover:shadow-[0_10px_40px_-8px_hsla(268,95%,60%,0.85)]")}
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--violet)) 0%, hsl(var(--indigo)) 50%, hsl(var(--cyan)) 100%)",
        backgroundSize: "200% 200%",
      }}
    >
      {/* drifting gradient layer */}
      <span
        aria-hidden
        className="absolute inset-0 animate-gradient-drift"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--violet)) 0%, hsl(var(--pink)) 35%, hsl(var(--cyan)) 70%, hsl(var(--violet)) 100%)",
          backgroundSize: "300% 300%",
          opacity: 0.95,
        }}
      />
      {/* shimmer overlay */}
      <span aria-hidden className="shimmer absolute inset-0 opacity-60" />
      {/* inner stroke */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20"
      />
      <Wallet className="relative z-10 size-4" />
      <span className="relative z-10">Connect Wallet</span>
    </button>
  );
}
