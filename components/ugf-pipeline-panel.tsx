"use client";

import {
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type PipelineUiState,
  type StageStatus,
  type StageName,
  STAGE_ORDER,
} from "@/lib/pipeline";
import { BASESCAN_TX_URL } from "@/lib/public-env";

const STAGE_LABELS: Record<StageName, string> = {
  quote: "Quote",
  settle: "Settle",
  execute: "Execute",
  confirm: "Confirm",
};

const STAGE_DESCRIPTIONS: Record<StageName, string> = {
  quote: "Calculating gas cost",
  settle: "Processing payment",
  execute: "Submitting transaction",
  confirm: "Waiting for confirmation",
};

function StageIcon({ status }: { status: StageStatus }) {
  switch (status) {
    case "active":
      return (
        <Loader2
          className="size-5 animate-spin text-violet drop-shadow-[0_0_8px_hsla(252,95%,70%,0.7)]"
          strokeWidth={2.25}
        />
      );
    case "success":
      return (
        <CheckCircle2
          className="size-5 text-cyan drop-shadow-[0_0_8px_hsla(192,95%,60%,0.6)]"
          strokeWidth={2.25}
        />
      );
    case "failed":
      return (
        <XCircle
          className="size-5 text-pink drop-shadow-[0_0_10px_hsla(330,95%,68%,0.7)]"
          strokeWidth={2.25}
        />
      );
    default:
      return <Circle className="size-5 text-muted-foreground/40" strokeWidth={1.5} />;
  }
}

function connectorClass(prev: StageStatus): string {
  if (prev === "success") {
    return "bg-gradient-to-b from-cyan/60 via-indigo/40 to-violet/30";
  }
  if (prev === "active") {
    return "bg-gradient-to-b from-violet/60 to-transparent";
  }
  if (prev === "failed") {
    return "bg-gradient-to-b from-pink/60 to-transparent";
  }
  return "bg-white/5";
}

export function UgfPipelinePanel({
  pipeline,
  onRetry,
  onReset,
}: {
  pipeline: PipelineUiState;
  onRetry?: () => void;
  onReset?: () => void;
}) {
  const hasTxHash = !!pipeline.txHash;
  const hasError = !!pipeline.errorMessage;

  return (
    <div className="gradient-border glass relative w-full max-w-md overflow-hidden rounded-xl">
      <div className="relative flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Transaction Pipeline
          </h3>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            UGF
          </span>
        </div>

        <div className="relative flex flex-col gap-1.5">
          {STAGE_ORDER.map((stage, idx) => {
            const status = pipeline[stage];
            const isActive = status === "active";
            const isSuccess = status === "success";
            const isFailed = status === "failed";
            const prevStatus =
              idx > 0 ? pipeline[STAGE_ORDER[idx - 1]] : "pending";
            const isLast = idx === STAGE_ORDER.length - 1;

            return (
              <div key={stage} className="relative">
                {/* connector to previous stage */}
                {idx > 0 && (
                  <div
                    aria-hidden
                    className={cn(
                      "absolute left-[1.4rem] -top-1.5 h-1.5 w-px",
                      connectorClass(prevStatus),
                    )}
                  />
                )}

                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive &&
                      "shimmer gradient-border bg-white/[0.04] shadow-[0_0_24px_-4px_hsla(252_95%_70%/0.45)]",
                    isSuccess && "bg-white/[0.02]",
                    isFailed &&
                      "gradient-border bg-pink/5 shadow-[0_0_22px_-6px_hsla(330_95%_68%/0.5)]",
                  )}
                >
                  <div className="relative flex size-7 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <StageIcon status={status} />
                  </div>

                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium leading-tight",
                        isActive && "text-gradient",
                        isSuccess && "text-foreground",
                        isFailed && "text-pink",
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {STAGE_DESCRIPTIONS[stage]}
                    </span>
                  </div>

                  {isSuccess &&
                    stage === "quote" &&
                    pipeline.quoteUsd && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-cyan/30 bg-cyan/10 text-cyan"
                      >
                        ${pipeline.quoteUsd}
                      </Badge>
                    )}
                  {isSuccess &&
                    stage === "quote" &&
                    pipeline.ethSavedEstimate && (
                      <Badge
                        variant="secondary"
                        className="ml-auto border border-violet/30 bg-violet/10 text-violet"
                      >
                        Save {pipeline.ethSavedEstimate} ETH
                      </Badge>
                    )}
                </div>

                {/* trailing connector for visual completeness */}
                {!isLast && (
                  <div
                    aria-hidden
                    className={cn(
                      "absolute left-[1.4rem] -bottom-1.5 h-1.5 w-px",
                      connectorClass(status),
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {hasTxHash && (
          <div className="flex items-center gap-2 rounded-lg border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs">
            <ExternalLink className="size-3.5 text-cyan" />
            <span className="text-muted-foreground">Tx</span>
            <a
              href={`${BASESCAN_TX_URL}${pipeline.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan transition-opacity hover:opacity-80"
            >
              {pipeline.txHash!.slice(0, 10)}...
              {pipeline.txHash!.slice(-6)}
            </a>
          </div>
        )}

        {hasError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-pink/30 bg-pink/10 px-3 py-2">
            <span className="text-xs text-pink">{pipeline.errorMessage}</span>
            {onRetry && (
              <Button
                variant="outline"
                size="xs"
                onClick={onRetry}
                className="border-pink/40 bg-pink/10 text-pink hover:bg-pink/20"
              >
                <RefreshCw className="size-3" />
                Retry
              </Button>
            )}
          </div>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="self-end text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
