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

export function useUgfClaim() {
  const { isConnected, address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const publicClient = usePublicClient();
  const [state, dispatch] = useReducer(pipelineReducer, INITIAL_PIPELINE_STATE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<bigint | null>(null);

  const claim = useCallback(
    async (campaignId: bigint) => {
      if (!isConnected || !address || !publicClient) return;

      dispatch({ type: "stage_start", stage: "quote" });

      try {
        dispatch({ type: "stage_success", stage: "quote" });
        dispatch({ type: "stage_start", stage: "settle" });
        dispatch({ type: "stage_success", stage: "settle" });
        dispatch({ type: "stage_start", stage: "execute" });

        const iface = new ethers.Interface([
          "function claim(uint256 campaignId)",
        ]);
        const data = iface.encodeFunctionData("claim", [campaignId]);

        // Send natively using Wagmi's active connector (triggers wallet popup reliably)
        const hash = await sendTransactionAsync({
          to: BADGE_CONTRACT_ADDRESS as `0x${string}`,
          data: data as `0x${string}`,
          value: BigInt(0),
        });

        dispatch({ type: "stage_success", stage: "execute" });
        dispatch({ type: "stage_start", stage: "confirm" });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const txHashResult = (receipt?.transactionHash ?? hash) as `0x${string}`;
        setTxHash(txHashResult);
        dispatch({
          type: "stage_success",
          stage: "confirm",
          data: { txHash: txHashResult },
        });
      } catch (e: any) {
        const uiError = mapErrorToUiMessage(e);
        const msg = uiError.message;
        const stage = STAGE_ORDER.find(
          (s) => state[s] === "active",
        ) ?? "quote";
        dispatch({ type: "stage_failure", stage, error: msg });
      }
    },
    [isConnected, address, publicClient, sendTransactionAsync, state],
  );

  const retry = useCallback(() => {
    if (state.failedStage) {
      dispatch({ type: "retry", stage: state.failedStage });
    }
  }, [state.failedStage]);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    setTxHash(null);
    setQuote(null);
  }, []);

  return {
    claim,
    pipeline: state,
    retry,
    reset,
    txHash,
    quote,
  };
}
