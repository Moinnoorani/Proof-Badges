"use client";

import { Check, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { canEnableStep3 } from "@/lib/onboarding";

interface OnboardingStepsProps {
  step1Done: boolean;
  step2Done: boolean;
  onMarkStep2Done: () => void;
}

export function OnboardingSteps({ step1Done, step2Done, onMarkStep2Done }: OnboardingStepsProps) {
  const step3Enabled = canEnableStep3({ step1Done, step2Done, balance: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>Complete these steps to claim your badge</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Step
          number={1}
          title="Connect Wallet"
          done={step1Done}
          active={!step1Done}
        />
        <Step
          number={2}
          title="Get Mock USD"
          done={step2Done}
          active={!step2Done && step1Done}
          action={
            !step2Done && step1Done ? (
              <Button size="sm" onClick={onMarkStep2Done}>
                I got Mock USD
              </Button>
            ) : undefined
          }
        />
        <Step
          number={3}
          title="Claim Badge"
          done={false}
          active={step3Enabled}
          dimmed={!step3Enabled}
        />
      </CardContent>
    </Card>
  );
}

function Step({
  number,
  title,
  done,
  active,
  action,
  dimmed,
}: {
  number: number;
  title: string;
  done: boolean;
  active: boolean;
  action?: React.ReactNode;
  dimmed?: boolean;
}) {
  const showInactive = !done && !active;

  return (
    <div className={`flex items-center gap-3 ${dimmed ? "opacity-50" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
          done
            ? "bg-primary text-primary-foreground"
            : active
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? <Check className="size-4" /> : <span>{number}</span>}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            done || active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {title}
        </p>
        {showInactive && !dimmed && (
          <p className="text-xs text-muted-foreground">
            {number === 2 ? "Get testnet tokens to cover gas fees" : "Complete previous steps first"}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
      {done && !action && <ArrowRight className="size-4 text-muted-foreground" />}
    </div>
  );
}
