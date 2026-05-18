export interface OnboardingState {
  step1Done: boolean;
  step2Done: boolean;
  balance: number;
}

/**
 * Determines whether step 3 ("Claim Badge") can be enabled in the onboarding flow.
 * Returns true only when both step 1 and step 2 are complete.
 * Balance is intentionally ignored — step 3 gating depends solely on explicit step completion.
 */
export function canEnableStep3({ step1Done, step2Done }: OnboardingState): boolean {
  return step1Done && step2Done;
}
