import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { MOCK_USD_ADDRESS } from "@/lib/public-env";

const MOCK_USD_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

export function useMockUsdBalance({
  address,
  faucetActive,
}: {
  address?: Address;
  faucetActive: boolean;
}) {
  const { data: balance, refetch } = useReadContract({
    address: MOCK_USD_ADDRESS,
    abi: MOCK_USD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      refetchInterval: faucetActive ? 5000 : false,
      enabled: !!address,
    },
  });

  return { balance: balance ?? BigInt(0), refresh: refetch };
}
