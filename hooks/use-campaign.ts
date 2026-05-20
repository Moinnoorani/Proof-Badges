"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { BADGE_CONTRACT_ADDRESS } from "@/lib/public-env";
import { deriveStatus, type CampaignStatus } from "@/lib/status";

const badgeAbi = [
  {
    type: "function",
    name: "campaigns",
    inputs: [{ type: "uint256", name: "campaignId" }],
    outputs: [
      { type: "uint256", name: "startTime" },
      { type: "uint256", name: "endTime" },
      { type: "uint256", name: "maxSupply" },
      { type: "uint256", name: "mintedCount" },
      { type: "bool", name: "soulbound" },
      { type: "string", name: "baseURI" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { type: "uint256", name: "campaignId" },
      { type: "address", name: "account" },
    ],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
  },
] as const;

export type CampaignMeta = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  maxSupply: number;
  startTime: number;
  endTime: number;
  soulbound: boolean;
  createdAt: number;
};

export type CampaignLive = CampaignMeta & {
  mintedCount: number;
  status: CampaignStatus;
  alreadyClaimed: boolean;
};

export function useCampaign(campaignId: string) {
  const { address } = useAccount();
  const [meta, setMeta] = useState<CampaignMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    setMetaError(null);

    fetch(`/api/campaigns/${campaignId}`)
      .then((res) => {
        if (cancelled) return null;
        if (!res.ok) {
          if (res.status === 404) throw new Error("not_found");
          throw new Error("metadata_unavailable");
        }
        return res.json() as Promise<CampaignMeta>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setMeta(data);
        setMetaLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setMetaError(err.message);
        setMetaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const isZeroAddress = BADGE_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000";

  const { data: onChainData, isLoading: onChainLoading, isError: onChainError, refetch: refetchOnChain } = useReadContract({
    address: BADGE_CONTRACT_ADDRESS,
    abi: badgeAbi,
    functionName: "campaigns",
    args: [BigInt(campaignId)],
    query: { enabled: !!meta && !isZeroAddress },
  });

  const { data: claimedData, refetch: refetchClaimed } = useReadContract({
    address: BADGE_CONTRACT_ADDRESS,
    abi: badgeAbi,
    functionName: "hasClaimed",
    args: [BigInt(campaignId), address!],
    query: { enabled: !!meta && !!address && !isZeroAddress },
  });

  const campaign: CampaignLive | null = useMemo(() => {
    if (!meta) return null;

    if (onChainData) {
      const [startTime, endTime, maxSupply, mintedCount] = onChainData;
      return {
        ...meta,
        mintedCount: Number(mintedCount),
        status: deriveStatus(
          {
            startTime: Number(startTime),
            endTime: Number(endTime),
            maxSupply: Number(maxSupply),
            mintedCount: Number(mintedCount),
          },
          Math.floor(Date.now() / 1000),
        ),
        alreadyClaimed: claimedData ?? false,
      };
    }

    if (isZeroAddress || onChainError) {
      return {
        ...meta,
        mintedCount: 0,
        status: deriveStatus(
          {
            startTime: meta.startTime,
            endTime: meta.endTime,
            maxSupply: meta.maxSupply,
            mintedCount: 0,
          },
          Math.floor(Date.now() / 1000),
        ),
        alreadyClaimed: false,
      };
    }

    return null;
  }, [meta, onChainData, claimedData, isZeroAddress, onChainError]);

  const refresh = () => {
    refetchOnChain();
    refetchClaimed();
  };

  const isLoading = metaLoading || (onChainLoading && !isZeroAddress);

  return {
    campaign,
    isLoading,
    error: metaError as "metadata_unavailable" | "not_found" | null,
    refresh,
  };
}
