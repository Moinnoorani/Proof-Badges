import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { canEnableStep3 } from "./onboarding";

/**
 * Property 9: Onboarding step gating
 * Validates: Requirements 9.3
 *
 * For any state {step1Done, step2Done, balance}:
 * - canEnableStep3 returns true iff step1Done === true AND step2Done === true
 * - The balance value MUST NOT influence the result
 */
describe("onboarding — Property 9: Onboarding step gating", () => {
  const onboardingArb = fc.record({
    step1Done: fc.boolean(),
    step2Done: fc.boolean(),
    balance: fc.double({ noNaN: true }),
  });

  it("canEnableStep3 returns true iff step1Done && step2Done", () => {
    fc.assert(
      fc.property(onboardingArb, ({ step1Done, step2Done, balance }) => {
        const result = canEnableStep3({ step1Done, step2Done, balance });
        const expected = step1Done && step2Done;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("balance does NOT influence the result", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.double({ noNaN: true }),
        fc.double({ noNaN: true }),
        (step1Done, step2Done, balance1, balance2) => {
          const r1 = canEnableStep3({ step1Done, step2Done, balance: balance1 });
          const r2 = canEnableStep3({ step1Done, step2Done, balance: balance2 });
          expect(r1).toBe(r2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("canEnableStep3 with step2Done=false returns false even with positive balance", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, noNaN: true }),
        (balance) => {
          const result = canEnableStep3({ step1Done: true, step2Done: false, balance });
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
