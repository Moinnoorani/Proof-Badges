import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildClaimLink, parseClaimLink } from "./claim-link";

/**
 * Property 8: Claim link round-trip
 * Validates: Requirements 8.1
 *
 * For any campaignId (uint256 represented as a decimal string),
 * parseClaimLink(buildClaimLink(campaignId)) === campaignId.
 */
describe("claim-link — Property 8: Claim link round-trip", () => {
  const decimalStringArb = fc.nat().map((n) => n.toString());

  it("parseClaimLink(buildClaimLink(id)) === id for any decimal-string campaignId", () => {
    fc.assert(
      fc.property(decimalStringArb, (campaignId) => {
        const link = buildClaimLink(campaignId);
        const parsed = parseClaimLink(link);
        expect(parsed).toBe(campaignId);
      }),
      { numRuns: 100 }
    );
  });
});
