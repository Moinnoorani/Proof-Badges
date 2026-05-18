"use client";

import { type ReactNode } from "react";
import { useNetworkGuard } from "@/hooks/use-network-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isCorrectNetwork, switchToBaseSepolia, addBaseSepolia } =
    useNetworkGuard();

  if (isCorrectNetwork) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-sm p-6 text-center">
        <CardHeader>
          <CardTitle>Wrong Network</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Please switch to Base Sepolia to use this application.
          </p>
          <Button onClick={switchToBaseSepolia}>Switch to Base Sepolia</Button>
          <Button variant="outline" onClick={addBaseSepolia}>
            Add Base Sepolia
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
