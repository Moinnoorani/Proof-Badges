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
  const { openUGF, result } = useUGFModal();
  const [state, dispatch] = useReducer(pipelineReducer, INITIAL_PIPELINE_STATE);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quote, setQuote] = useState<bigint | null>(null);

  useEffect(() => {
    if (result?.txHash) {
      const hash = result.txHash as `0x${string}`;
      setTxHash(result.txHash);
      dispatch({
        type: "stage_success",
        stage: "confirm",
        data: { txHash: hash },
      });
    }
  }, [result]);

  const claim = useCallback(
    async (campaignId: bigint) => {
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
            setTimeout(
              () => reject(new Error("Quote timed out")),
              10000,
            ),
          ),
        ]);

        dispatch({ type: "stage_success", stage: "quote" });
        dispatch({ type: "stage_start", stage: "settle" });
        dispatch({ type: "stage_success", stage: "settle" });
        dispatch({ type: "stage_start", stage: "execute" });

        const iface = new ethers.Interface([
          "function claim(uint256 campaignId)",
        ]);
        const data = iface.encodeFunctionData("claim", [campaignId]);

        openUGF({
          signer,
          tx: {
            to: BADGE_CONTRACT_ADDRESS,
            data,
            value: "0x0",
          },
          destChainId: "84532",
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
    [isConnected, address, openUGF, state],
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
