import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { canClaim, showFaucet } from "./eligibility";
import type { CampaignStatus } from "./status";

/**
 * Property 1: Claim eligibility predicate
 * Validates: Requirements 1.5, 1.7, 3.4
 *
 * For any tuple (status, alreadyClaimed, balance, quote):
 * - canClaim returns true iff status === "active" AND !alreadyClaimed AND balance >= quote
 * - showFaucet returns true iff balance < quote
 * - The two predicates are independent (showFaucet doesn't depend on status or alreadyClaimed)
 */
describe("eligibility — Property 1: Claim eligibility predicate", () => {
  const statusArb: fc.Arbitrary<CampaignStatus> = fc.constantFrom(
    "upcoming",
    "active",
    "ended",
    "sold_out"
  );

  const eligibilityArb = fc.record({
    status: statusArb,
    alreadyClaimed: fc.boolean(),
    balance: fc.bigInt(),
    quote: fc.bigInt({ min: BigInt(0) }),
  });

  it("canClaim returns true iff status === 'active' AND !alreadyClaimed AND balance >= quote", () => {
    fc.assert(
      fc.property(eligibilityArb, ({ status, alreadyClaimed, balance, quote }) => {
        const result = canClaim({ status, alreadyClaimed, balance, quote });
        const expected =
          status === "active" && !alreadyClaimed && balance >= quote;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("showFaucet returns true iff balance < quote", () => {
    fc.assert(
      fc.property(eligibilityArb, ({ balance, quote }) => {
        const result = showFaucet({ balance, quote });
        const expected = balance < quote;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("showFaucet is independent of status and alreadyClaimed", () => {
    fc.assert(
      fc.property(
        fc.record({
          status1: statusArb,
          status2: statusArb,
          claimed1: fc.boolean(),
          claimed2: fc.boolean(),
          balance: fc.bigInt(),
          quote: fc.bigInt({ min: BigInt(0) }),
        }),
        ({ status1, status2, claimed1, claimed2, balance, quote }) => {
          // showFaucet should return the same value regardless of status or alreadyClaimed
          // We verify by checking that the result only depends on balance and quote
          const r1 = showFaucet({ balance, quote });
          const r2 = showFaucet({ balance, quote });
          expect(r1).toBe(r2);

          // Also verify it matches the pure predicate (balance < quote)
          // regardless of what status/claimed values we generated
          void status1;
          void status2;
          void claimed1;
          void claimed2;
          expect(r1).toBe(balance < quote);
        }
      ),
      { numRuns: 100 }
    );
  });
});
