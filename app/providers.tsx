"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount, useAccountEffect } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { ReactNode, useState, useRef, useEffect } from "react";
import { UGFProvider } from "@tychilabs/react-ugf";

function WagmiWatcher({ queryClient }: { queryClient: QueryClient }) {
  const { address } = useAccount();
  const prevAddress = useRef(address);

  useAccountEffect({
    onDisconnect() {
      queryClient.removeQueries();
    },
  });

  useEffect(() => {
    if (prevAddress.current && prevAddress.current !== address) {
      queryClient.removeQueries();
    }
    prevAddress.current = address;
  }, [address, queryClient]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <UGFProvider mode="testnet">
          <WagmiWatcher queryClient={queryClient} />
          {children}
        </UGFProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
