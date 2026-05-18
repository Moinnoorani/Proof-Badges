import { useSwitchChain, useChainId } from "wagmi";
import { useCallback } from "react";
import { baseSepolia } from "wagmi/chains";

export function useNetworkGuard() {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isCorrectNetwork = chainId === baseSepolia.id;

  const switchToBaseSepolia = useCallback(async () => {
    await switchChainAsync({ chainId: baseSepolia.id });
  }, [switchChainAsync]);

  const addBaseSepolia = useCallback(async () => {
    try {
      await (window as any).ethereum?.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${baseSepolia.id.toString(16)}`,
            chainName: baseSepolia.name,
            nativeCurrency: baseSepolia.nativeCurrency,
            rpcUrls: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? ""],
            blockExplorerUrls: ["https://sepolia.basescan.org"],
          },
        ],
      });
    } catch {
      // user rejected or chain already added
    }
  }, []);

  return { isCorrectNetwork, switchToBaseSepolia, addBaseSepolia };
}
