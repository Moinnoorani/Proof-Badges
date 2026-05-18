"use client";

import { Circle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type PipelineUiState,
  type StageName,
  STAGE_ORDER,
} from "@/lib/pipeline";

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

function StageIcon({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Loader2 className="size-5 animate-spin text-primary" />;
    case "success":
      return <CheckCircle2 className="size-5 text-green-500" />;
    case "failed":
      return <XCircle className="size-5 text-red-500" />;
    default:
      return <Circle className="size-5 text-muted-foreground/50" />;
  }
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
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col gap-3 pt-4">
        <h3 className="text-sm font-semibold">Transaction Pipeline</h3>

        <div className="flex flex-col gap-2">
          {STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                pipeline[stage] === "active" && "bg-muted/50",
                pipeline[stage] === "failed" &&
                  "bg-destructive/10 dark:bg-destructive/20",
              )}
            >
              <StageIcon status={pipeline[stage]} />
              <div className="flex flex-col">
                <span className="font-medium">{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-muted-foreground">
                  {STAGE_DESCRIPTIONS[stage]}
                </span>
              </div>
              {pipeline[stage] === "success" &&
                stage === "quote" &&
                pipeline.quoteUsd && (
                  <Badge variant="outline" className="ml-auto">
                    ${pipeline.quoteUsd}
                  </Badge>
                )}
              {pipeline[stage] === "success" &&
                stage === "quote" &&
                pipeline.ethSavedEstimate && (
                  <Badge variant="secondary" className="ml-auto">
                    Save {pipeline.ethSavedEstimate} ETH
                  </Badge>
                )}
            </div>
          ))}
        </div>

        {hasTxHash && (
          <div className="text-xs text-muted-foreground">
            Tx:{" "}
            <a
              href={`https://sepolia.basescan.org/tx/${pipeline.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {pipeline.txHash!.slice(0, 10)}...
              {pipeline.txHash!.slice(-6)}
            </a>
          </div>
        )}

        {hasError && (
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2 dark:bg-destructive/20">
            <span className="text-xs text-destructive">
              {pipeline.errorMessage}
            </span>
            {onRetry && (
              <Button variant="outline" size="xs" onClick={onRetry}>
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
            className="self-end"
          >
            Reset
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
