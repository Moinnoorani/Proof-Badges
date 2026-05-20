"use client";

import { useCallback, useReducer, useState } from "react";
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
  const [state, dispatch] = useReducer(pipelineReducer, INITIAL_PIPELINE_STATE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<bigint | null>(null);

  const claim = useCallback(
    async (campaignId: bigint) => {
      if (!isConnected || !address || typeof window === "undefined") return;

      dispatch({ type: "stage_start", stage: "quote" });

      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        dispatch({ type: "stage_success", stage: "quote" });
        dispatch({ type: "stage_start", stage: "settle" });
        dispatch({ type: "stage_success", stage: "settle" });
        dispatch({ type: "stage_start", stage: "execute" });

        const iface = new ethers.Interface([
          "function claim(uint256 campaignId)",
        ]);
        const data = iface.encodeFunctionData("claim", [campaignId]);

        // Send directly via MetaMask — no Mock USD / UGF required
        const tx = await signer.sendTransaction({
          to: BADGE_CONTRACT_ADDRESS,
          data,
          value: "0x0",
        });

        dispatch({ type: "stage_success", stage: "execute" });
        dispatch({ type: "stage_start", stage: "confirm" });

        const receipt = await tx.wait();
        const hash = (receipt?.hash ?? tx.hash) as `0x${string}`;
        setTxHash(hash);
        dispatch({
          type: "stage_success",
          stage: "confirm",
          data: { txHash: hash },
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
    [isConnected, address, state],
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
