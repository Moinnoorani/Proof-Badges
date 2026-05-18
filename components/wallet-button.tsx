"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button variant="outline" onClick={() => disconnect()}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  const connector = connectors[0];
  return (
    <Button onClick={() => connector && connect({ connector })}>
      Connect Wallet
    </Button>
  );
}
