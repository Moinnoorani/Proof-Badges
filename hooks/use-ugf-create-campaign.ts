"use client";

import { useCallback, useReducer, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useSendTransaction, usePublicClient } from "wagmi";
import {
  mapSdkEventToPipelineState,
  INITIAL_PIPELINE_STATE,
  type PipelineUiState,
  type PipelineEvent,
  type StageName,
  STAGE_ORDER,
} from "@/lib/pipeline";
import { BADGE_CONTRACT_ADDRESS } from "@/lib/public-env";
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
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [state, dispatch] = useReducer(pipelineReducer, INITIAL_PIPELINE_STATE);
  const [campaignId, setCampaignId] = useState<bigint | null>(null);
  const [campaignIdError, setCampaignIdError] = useState<string | null>(null);

  const create = useCallback(
    async (params: CreateCampaignParams) => {
      if (!isConnected || !address || !publicClient) return;

      dispatch({ type: "stage_start", stage: "quote" });

      try {
        dispatch({ type: "stage_success", stage: "quote" });
        dispatch({ type: "stage_start", stage: "settle" });
        dispatch({ type: "stage_success", stage: "settle" });
        dispatch({ type: "stage_start", stage: "execute" });

        const iface = new ethers.Interface([
          "function createCampaign(uint96 maxSupply, uint64 startTime, uint64 endTime, bool soulbound, string baseURI) returns (uint256 campaignId)",
        ]);
        const data = iface.encodeFunctionData("createCampaign", [
          BigInt(params.maxSupply),
          BigInt(params.startTime),
          BigInt(params.endTime),
          params.soulbound,
          params.baseURI,
        ]);

        // Send natively using Wagmi's active connector (triggers wallet popup reliably)
        const hash = await sendTransactionAsync({
          to: BADGE_CONTRACT_ADDRESS as `0x${string}`,
          data: data as `0x${string}`,
          value: BigInt(0),
        });

        dispatch({ type: "stage_success", stage: "execute" });
        dispatch({ type: "stage_start", stage: "confirm" });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt) {
          const eventIface = new ethers.Interface([
            "event CampaignCreated(uint256 indexed campaignId, address indexed creator)",
          ]);
          let found = false;
          for (const log of receipt.logs) {
            try {
              const parsed = eventIface.parseLog({
                topics: [...log.topics],
                data: log.data,
              });
              if (parsed?.name === "CampaignCreated") {
                setCampaignId(parsed.args.campaignId);
                found = true;
                break;
              }
            } catch {
              // not the event we're looking for
            }
          }
          if (!found) {
            setCampaignIdError(
              "Campaign was submitted but could not confirm the campaign ID. Please check your dashboard.",
            );
          }
        } else {
          setCampaignIdError(
            "Transaction receipt not found. Please check your dashboard to confirm the campaign was created.",
          );
        }

        const txHashResult = (receipt?.transactionHash ?? hash) as `0x${string}`;
        dispatch({
          type: "stage_success",
          stage: "confirm",
          data: { txHash: txHashResult },
        });
      } catch (e: any) {
        const uiError = mapErrorToUiMessage(e);
        const stage = STAGE_ORDER.find((s) => state[s] === "active") ?? "quote";
        dispatch({ type: "stage_failure", stage, error: uiError.message });
      }
    },
    [isConnected, address, publicClient, sendTransactionAsync, state],
  );

  const retry = useCallback(() => {
    if (state.failedStage) {
      dispatch({ type: "retry", stage: state.failedStage });
    }
  }, [state.failedStage]);

  return { create, pipeline: state, retry, campaignId, campaignIdError };
}
