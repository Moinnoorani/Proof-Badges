"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useMockUsdBalance } from "@/hooks/use-mock-usd-balance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MockUsdBalance() {
  const { address, isConnected } = useAccount();
  const { balance } = useMockUsdBalance({ address, faucetActive: true });

  if (!isConnected || !address) return null;

  const formatted = Number(formatUnits(balance as bigint, 18)).toFixed(2);
  const isLow = (balance as bigint) === BigInt(0);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isLow ? "destructive" : "outline"}>${formatted} USD</Badge>
      <Button
        variant={isLow ? "default" : "outline"}
        size="xs"
        onClick={() =>
          window.open(
            `https://universalgasframework.com/faucets?address=${address}`,
            "_blank",
          )
        }
      >
        Get Mock USD
      </Button>
    </div>
  );
}
