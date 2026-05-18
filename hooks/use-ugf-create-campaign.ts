"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useUGFModal } from "@tychilabs/react-ugf";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import {
  mapSdkEventToPipelineState,
  INITIAL_PIPELINE_STATE,
  type PipelineUiState,
  type PipelineEvent,
  type StageName,
  STAGE_ORDER,
} from "@/lib/pipeline";
import { BADGE_CONTRACT_ADDRESS } from "@/lib/public-env";
import { BASE_SEPOLIA_RPC } from "@/lib/public-env";
import { mapErrorToUiMessage } from "@/lib/errors";

type PipelineAction = PipelineEvent | { type: "reset" };

function pipelineReducer(
  state: PipelineUiState,
  action: PipelineAction,
): PipelineUiState {
  if (action.type === "reset") return INITIAL_PIPELINE_STATE;
  return mapSdkEventToPipelineState(state, action);
}

export interface CreateCampaignParams {
  maxSupply: number;
  startTime: number;
  endTime: number;
  soulbound: boolean;
  baseURI: string;
}

export function useUgfCreateCampaign() {
  const { isConnected, address } = useAccount();
  const { openUGF, result } = useUGFModal();
  const [state, dispatch] = useReducer(pipelineReducer, INITIAL_PIPELINE_STATE);
  const [campaignId, setCampaignId] = useState<bigint | null>(null);

  useEffect(() => {
    if (result?.txHash) {
      const hash = result.txHash as `0x${string}`;
      dispatch({
        type: "stage_success",
        stage: "confirm",
        data: { txHash: hash },
      });

      (async () => {
        try {
          const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
          const receipt = await provider.getTransactionReceipt(result.txHash);
          if (receipt) {
            const iface = new ethers.Interface([
              "event CampaignCreated(uint256 indexed campaignId, address indexed creator)",
            ]);
            for (const log of receipt.logs) {
              try {
                const parsed = iface.parseLog({
                  topics: [...log.topics],
                  data: log.data,
                });
                if (parsed?.name === "CampaignCreated") {
                  setCampaignId(parsed.args.campaignId);
                  break;
                }
              } catch {
                // not the event we're looking for
              }
            }
          }
        } catch {
          // receipt fetch failed, campaignId stays null
        }
      })();
    }
  }, [result]);

  const create = useCallback(
    async (params: CreateCampaignParams) => {
      if (!isConnected || !address || typeof window === "undefined") return;

      dispatch({ type: "stage_start", stage: "quote" });

      try {
        const signer = await Promise.race([
          (async () => {
            const provider = new ethers.BrowserProvider(
              (window as any).ethereum,
            );
            return provider.getSigner();
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Quote timed out")), 10000),
          ),
        ]);

        dispatch({ type: "stage_success", stage: "quote" });
        dispatch({ type: "stage_start", stage: "settle" });
        dispatch({ type: "stage_success", stage: "settle" });
        dispatch({ type: "stage_start", stage: "execute" });

        const iface = new ethers.Interface([
          "function createCampaign(uint256 maxSupply, uint256 startTime, uint256 endTime, bool soulbound, string baseURI) returns (uint256 campaignId)",
        ]);
        const data = iface.encodeFunctionData("createCampaign", [
          BigInt(params.maxSupply),
          BigInt(params.startTime),
          BigInt(params.endTime),
          params.soulbound,
          params.baseURI,
        ]);

        openUGF({
          signer,
          tx: { to: BADGE_CONTRACT_ADDRESS, data, value: "0x0" },
          destChainId: "84532",
        });
      } catch (e: any) {
        const uiError = mapErrorToUiMessage(e);
        const stage = STAGE_ORDER.find((s) => state[s] === "active") ?? "quote";
        dispatch({ type: "stage_failure", stage, error: uiError.message });
      }
    },
    [isConnected, address, openUGF, state],
  );

  const retry = useCallback(() => {
    if (state.failedStage) {
      dispatch({ type: "retry", stage: state.failedStage });
    }
  }, [state.failedStage]);

  return { create, pipeline: state, retry, campaignId };
}
