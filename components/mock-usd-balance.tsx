"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { Coins, Droplet } from "lucide-react";
import { useMockUsdBalance } from "@/hooks/use-mock-usd-balance";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MockUsdBalance() {
  const { address, isConnected } = useAccount();
  const { balance } = useMockUsdBalance({ address, faucetActive: true });

  if (!isConnected || !address) return null;

  const formatted = Number(formatUnits(balance as bigint, 18)).toFixed(2);
  const isLow = (balance as bigint) === BigInt(0);

  return (
    <div
      className={cn(
        "gradient-border glass relative flex items-center gap-2 rounded-full py-1 pl-1 pr-1",
        isLow && "animate-glow-pulse",
      )}
    >
      <div className="flex items-center gap-1.5 pl-2 pr-1 text-xs font-medium">
        <Coins
          className={cn(
            "size-3.5",
            isLow ? "text-pink" : "text-cyan",
          )}
        />
        <span
          className={cn(
            "tabular-nums",
            isLow
              ? "text-gradient-warm"
              : "text-foreground/90",
          )}
        >
          ${formatted}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          USD
        </span>
      </div>
      <Button
        variant={isLow ? "default" : "outline"}
        size="xs"
        onClick={() =>
          window.open(
            `https://universalgasframework.com/faucets?address=${address}`,
            "_blank",
          )
        }
        className={cn(
          "rounded-full",
          isLow
            ? "bg-gradient-to-r from-violet to-pink text-white shadow-[0_0_20px_hsla(330_95%_68%/0.45)] hover:opacity-90"
            : "border-white/15 bg-white/5 backdrop-blur-md hover:border-cyan/40 hover:bg-white/10",
        )}
      >
        <Droplet className="size-3" />
        {isLow ? "Get USD" : "Faucet"}
      </Button>
    </div>
  );
}
