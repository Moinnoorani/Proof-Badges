"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { BADGE_CONTRACT_ADDRESS } from "@/lib/public-env";
import { groupBadgesByCampaign, type Badge } from "@/lib/group-badges";

const BADGE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "index", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenIdToCampaign",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "campaigns",
    inputs: [{ name: "campaignId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "startTime", type: "uint256", internalType: "uint256" },
      { name: "endTime", type: "uint256", internalType: "uint256" },
      { name: "maxSupply", type: "uint256", internalType: "uint256" },
      { name: "mintedCount", type: "uint256", internalType: "uint256" },
      { name: "soulbound", type: "bool", internalType: "bool" },
      { name: "baseURI", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
] as const;

function parseTokenURI(uri: string): { name?: string; image?: string } {
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      return JSON.parse(atob(uri.slice(29)));
    }
    return JSON.parse(uri);
  } catch {
    if (uri.startsWith("http")) return { image: uri };
    return {};
  }
}

export function useOwnedBadges(address: `0x${string}` | undefined) {
  const { data: balanceData, isLoading: isBalanceLoading } = useReadContract({
    address: BADGE_CONTRACT_ADDRESS,
    abi: BADGE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const balance = Number(balanceData ?? BigInt(0));

  const tokenIndexContracts = useMemo(
    () =>
      Array.from({ length: balance }, (_, i) => ({
        address: BADGE_CONTRACT_ADDRESS,
        abi: BADGE_ABI,
        functionName: "tokenOfOwnerByIndex" as const,
        args: [address!, BigInt(i)] as const,
      })),
    [balance, address]
  );

  const { data: tokenIdsData, isLoading: isTokenIdsLoading } =
    useReadContracts({
      contracts: tokenIndexContracts,
      query: { enabled: balance > 0 && !!address },
    });

  const tokenIds = useMemo(() => {
    if (!tokenIdsData) return [];
    return tokenIdsData
      .map((r) => {
        if (r.status === "success") return r.result as bigint;
        return undefined;
      })
      .filter((id): id is bigint => id !== undefined);
  }, [tokenIdsData]);

  const badgeDataContracts = useMemo(
    () =>
      tokenIds.flatMap((tokenId) => [
        {
          address: BADGE_CONTRACT_ADDRESS,
          abi: BADGE_ABI,
          functionName: "tokenIdToCampaign" as const,
          args: [tokenId] as const,
        },
        {
          address: BADGE_CONTRACT_ADDRESS,
          abi: BADGE_ABI,
          functionName: "tokenURI" as const,
          args: [tokenId] as const,
        },
      ]),
    [tokenIds]
  );

  const { data: badgeMetaData, isLoading: isMetaLoading } = useReadContracts({
    contracts: badgeDataContracts,
    query: { enabled: tokenIds.length > 0 },
  });

  // Collect unique campaign IDs from the first batch so we can fetch soulbound flags.
  const uniqueCampaignIds = useMemo(() => {
    if (!badgeMetaData || tokenIds.length === 0) return [];
    const ids = new Set<bigint>();
    for (let i = 0; i < tokenIds.length; i++) {
      const campaignResult = badgeMetaData[i * 2];
      if (campaignResult?.status === "success") {
        ids.add(campaignResult.result as bigint);
      }
    }
    return Array.from(ids);
  }, [badgeMetaData, tokenIds]);

  const campaignDataContracts = useMemo(
    () =>
      uniqueCampaignIds.map((campaignId) => ({
        address: BADGE_CONTRACT_ADDRESS,
        abi: BADGE_ABI,
        functionName: "campaigns" as const,
        args: [campaignId] as const,
      })),
    [uniqueCampaignIds]
  );

  const { data: campaignOnChainData, isLoading: isCampaignDataLoading } =
    useReadContracts({
      contracts: campaignDataContracts,
      query: { enabled: uniqueCampaignIds.length > 0 },
    });

  // Build a map from campaignId string -> soulbound boolean.
  const soulboundByCampaign = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!campaignOnChainData) return map;
    for (let i = 0; i < uniqueCampaignIds.length; i++) {
      const result = campaignOnChainData[i];
      if (result?.status === "success") {
        // campaigns() returns [startTime, endTime, maxSupply, mintedCount, soulbound, baseURI]
        const [, , , , soulbound] = result.result as [bigint, bigint, bigint, bigint, boolean, string];
        map[uniqueCampaignIds[i].toString()] = soulbound;
      }
    }
    return map;
  }, [campaignOnChainData, uniqueCampaignIds]);

  const badges = useMemo(() => {
    if (!badgeMetaData || tokenIds.length === 0) return [];

    const result: Badge[] = [];
    for (let i = 0; i < tokenIds.length; i++) {
      const campaignResult = badgeMetaData[i * 2];
      const uriResult = badgeMetaData[i * 2 + 1];

      if (campaignResult?.status !== "success") continue;
      if (uriResult?.status !== "success") continue;

      const campaignId = (campaignResult.result as bigint).toString();
      const uri = uriResult.result as string;

      const meta = parseTokenURI(uri);

      result.push({
        tokenId: tokenIds[i].toString(),
        campaignId,
        imageUrl: meta.image,
        name: meta.name,
        soulbound: soulboundByCampaign[campaignId],
      });
    }

    return result;
  }, [badgeMetaData, tokenIds, soulboundByCampaign]);

  const grouped = useMemo(() => groupBadgesByCampaign(badges), [badges]);

  return {
    badges: grouped,
    isLoading: isBalanceLoading || isTokenIdsLoading || isMetaLoading || isCampaignDataLoading,
    isEmpty: !isBalanceLoading && balance === 0,
  };
}
