"use client";

import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface OnboardingStepsProps {
  step1Done: boolean;
}

export function OnboardingSteps({ step1Done }: OnboardingStepsProps) {
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
          title="Claim Badge"
          done={false}
          active={step1Done}
          dimmed={!step1Done}
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
  dimmed,
}: {
  number: number;
  title: string;
  done: boolean;
  active: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${dimmed ? "opacity-40" : ""}`}>
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
      <p
        className={`text-sm font-medium ${
          done || active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {title}
      </p>
    </div>
  );
}
